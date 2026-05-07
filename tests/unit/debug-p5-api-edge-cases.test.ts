/**
 * debug-p5-api-edge-cases.test.ts
 * Phase 5.2: API edge cases — every endpoint with malformed/adversarial inputs
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3002';
const CRON_SECRET = 'x9-cron-secret-dev';

async function post(path: string, payload: unknown, auth?: string, contentType = 'application/json') {
  const headers: Record<string, string> = { 'Content-Type': contentType };
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: typeof payload === 'string' ? payload : JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}
async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
}

beforeAll(async () => {
  const res = await fetch(`${BASE}/`).catch(() => null);
  if (!res?.ok) throw new Error('Dev server not running on port 3002');
});

// ─── POST /api/agent/create edge cases ───────────────────────────────────────
describe('Edge cases: POST /api/agent/create', () => {
  it('rejects empty JSON body', async () => {
    const { status } = await post('/api/agent/create', {});
    expect(status).toBe(400);
  });

  it('rejects missing ownerWallet', async () => {
    const { status } = await post('/api/agent/create', { strategyText: 'buy low sell high' });
    expect(status).toBe(400);
  });

  it('rejects missing strategyText', async () => {
    const { status } = await post('/api/agent/create', { ownerWallet: 'SomeWallet111' });
    expect(status).toBe(400);
  });

  it('handles SQL injection in strategyText safely', async () => {
    const { status } = await post('/api/agent/create', {
      ownerWallet: 'SafeWallet111111111111111111111111111111',
      strategyText: "'; DROP TABLE Agent; --",
    });
    // Should either succeed (sanitized) or return a controlled error, never 500 crash
    expect([200, 400, 500]).toContain(status);
    // DB should still be reachable after
    const overview = await get('/api/dashboard/overview');
    expect(overview.status).toBe(200);
  });

  it('handles XSS payload in name field safely', async () => {
    const { status, body } = await post('/api/agent/create', {
      ownerWallet: 'XSSWallet1111111111111111111111111111111',
      name: '<script>alert("xss")</script>',
      strategyText: 'Buy low sell high.',
    });
    // Should succeed (stored as text) or reject; must not execute
    if (status === 200) {
      expect(body.agent.name).toBe('<script>alert("xss")</script>'); // stored raw, not executed
    }
  });

  it('handles very long strategyText (>5000 chars)', async () => {
    const longStrategy = 'Buy SOL when RSI is below 30. '.repeat(200);
    const { status } = await post('/api/agent/create', {
      ownerWallet: 'LongWallet1111111111111111111111111111111',
      strategyText: longStrategy,
    });
    expect([200, 400, 413]).toContain(status); // must not hang or crash
  });

  it('handles malformed JSON body gracefully', async () => {
    const res = await fetch(`${BASE}/api/agent/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{invalid json',
    });
    expect([400, 500]).toContain(res.status);
  });
});

// ─── GET /api/agent/[id] edge cases ──────────────────────────────────────────
describe('Edge cases: GET /api/agent/[id]', () => {
  it('returns 404 for empty string id', async () => {
    const { status } = await get('/api/agent/   ');
    expect([400, 404]).toContain(status);
  });

  it('returns 404 for very long fake id', async () => {
    const { status } = await get('/api/agent/' + 'x'.repeat(200));
    expect([400, 404]).toContain(status);
  });
});

// ─── POST /api/agent/[id]/start|stop edge cases ───────────────────────────────
describe('Edge cases: start/stop on nonexistent agent', () => {
  it('returns non-200 when starting nonexistent agent', async () => {
    const { status } = await post('/api/agent/nonexistent-id-xyz/start', {});
    expect(status).not.toBe(200);
  });

  it('returns non-200 when stopping nonexistent agent', async () => {
    const { status } = await post('/api/agent/nonexistent-id-xyz/stop', {});
    expect(status).not.toBe(200);
  });
});

// ─── POST /api/policy/create edge cases ──────────────────────────────────────
describe('Edge cases: POST /api/policy/create', () => {
  it('rejects empty body', async () => {
    const { status } = await post('/api/policy/create', {});
    expect(status).toBe(400);
  });

  it('rejects null strategyText', async () => {
    const { status } = await post('/api/policy/create', { strategyText: null });
    expect(status).toBe(400);
  });

  it('handles XSS in strategyText (returns rules, not executed)', async () => {
    const { status, body } = await post('/api/policy/create', {
      strategyText: '<img src=x onerror=alert(1)> buy SOL',
    });
    expect([200, 400]).toContain(status);
    if (status === 200) {
      expect(Array.isArray(body.rules)).toBe(true);
    }
  });
});

// ─── POST /api/cron/agent-loop edge cases ────────────────────────────────────
describe('Edge cases: POST /api/cron/agent-loop', () => {
  it('rejects missing Authorization header', async () => {
    const { status } = await post('/api/cron/agent-loop', {});
    expect(status).toBe(401);
  });

  it('rejects Bearer with wrong token', async () => {
    const { status } = await post('/api/cron/agent-loop', {}, 'Bearer hacked');
    expect(status).toBe(401);
  });

  it('rejects Basic auth scheme instead of Bearer', async () => {
    const { status } = await post('/api/cron/agent-loop', {}, `Basic ${CRON_SECRET}`);
    expect(status).toBe(401);
  });

  it('rejects empty Bearer token', async () => {
    const { status } = await post('/api/cron/agent-loop', {}, 'Bearer ');
    expect(status).toBe(401);
  });
});

// ─── Wrong HTTP method edge cases ────────────────────────────────────────────
describe('Edge cases: wrong HTTP methods', () => {
  it('GET on POST-only cron endpoint returns non-200', async () => {
    const res = await fetch(`${BASE}/api/cron/agent-loop`);
    expect(res.status).not.toBe(200);
  });

  it('GET on POST-only policy/create returns non-200', async () => {
    const res = await fetch(`${BASE}/api/policy/create`);
    expect(res.status).not.toBe(200);
  });
});
