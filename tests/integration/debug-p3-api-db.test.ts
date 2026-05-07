/**
 * debug-p3-api-db.test.ts
 * Phase 3: Integration tests — API routes ↔ SQLite DB
 * Tests every API route's connection to the database layer.
 * Server must be running on port 3002 before this suite executes.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = 'http://localhost:3002';
const CRON_SECRET = 'x9-cron-secret-dev';

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
}

async function post(path: string, payload: unknown, auth?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json().catch(() => null) };
}

// ─── Preflight: server must be up ────────────────────────────────────────────
beforeAll(async () => {
  const res = await fetch(`${BASE}/api/dashboard/overview`).catch(() => null);
  if (!res?.ok) throw new Error('Dev server not running on port 3002. Start it before running integration tests.');
});

// ─── Layer 1: Dashboard overview ↔ DB ────────────────────────────────────────
describe('API↔DB: dashboard/overview', () => {
  it('returns correct shape with DB counts', async () => {
    const { status, body } = await get('/api/dashboard/overview');
    expect(status).toBe(200);
    expect(body).toHaveProperty('totalAgents');
    expect(body).toHaveProperty('activeAgents');
    expect(body).toHaveProperty('totalTrades');
    expect(body).toHaveProperty('totalPnl');
    expect(body).toHaveProperty('recentTrades');
    expect(body).toHaveProperty('blockEvents');
    expect(Array.isArray(body.recentTrades)).toBe(true);
    expect(Array.isArray(body.blockEvents)).toBe(true);
  });

  it('returns non-zero agents from seeded DB', async () => {
    const { body } = await get('/api/dashboard/overview');
    expect(body.totalAgents).toBeGreaterThan(0);
  });

  it('returns non-zero trades from seeded DB', async () => {
    const { body } = await get('/api/dashboard/overview');
    expect(body.totalTrades).toBeGreaterThan(0);
  });

  it('recentTrades have correct shape', async () => {
    const { body } = await get('/api/dashboard/overview');
    const trade = body.recentTrades[0];
    expect(trade).toHaveProperty('id');
    expect(trade).toHaveProperty('action');
    expect(trade).toHaveProperty('status');
    expect(trade).toHaveProperty('agentId');
    expect(trade).toHaveProperty('createdAt');
  });
});

// ─── Layer 2: Agent CRUD ↔ DB ────────────────────────────────────────────────
describe('API↔DB: agent CRUD', () => {
  let createdAgentId: string;

  it('creates an agent and stores in DB', async () => {
    const { status, body } = await post('/api/agent/create', {
      ownerWallet: 'TestWallet111111111111111111111111111111111',
      name: 'Debug Integration Test Agent',
      strategyText: 'Buy when RSI < 30, sell when RSI > 70, max 0.1 SOL per trade',
    });
    expect(status).toBe(200);
    expect(body.agent).toBeDefined();
    expect(body.agent.id).toBeTruthy();
    expect(body.agent.name).toBe('Debug Integration Test Agent');
    expect(body.agent.status).toBe('paused');
    createdAgentId = body.agent.id;
  });

  it('reads the created agent back from DB', async () => {
    const { status, body } = await get(`/api/agent/${createdAgentId}`);
    expect(status).toBe(200);
    expect(body.id).toBe(createdAgentId);
    expect(body.name).toBe('Debug Integration Test Agent');
    expect(body.swigPolicyId).toBeTruthy(); // mock-policy or real
  });

  it('starts the agent and updates DB status', async () => {
    const { status, body } = await post(`/api/agent/${createdAgentId}/start`, {});
    expect(status).toBe(200);
    expect(body.status).toBe('active');
  });

  it('reads agent as active after start', async () => {
    const { body } = await get(`/api/agent/${createdAgentId}`);
    expect(body.status).toBe('active');
  });

  it('stops the agent and updates DB status', async () => {
    const { status, body } = await post(`/api/agent/${createdAgentId}/stop`, {});
    expect(status).toBe(200);
    expect(body.status).toBe('stopped');
  });

  it('reads agent as stopped after stop', async () => {
    const { body } = await get(`/api/agent/${createdAgentId}`);
    expect(body.status).toBe('stopped');
  });

  it('returns trades array for agent (even if empty)', async () => {
    const { status, body } = await get(`/api/agent/${createdAgentId}/trades`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
  });

  it('returns pnl data object for agent', async () => {
    const { status, body } = await get(`/api/agent/${createdAgentId}/pnl`);
    expect(status).toBe(200);
    expect(body).toHaveProperty('pnlData');
    expect(body).toHaveProperty('totalPnl');
    expect(Array.isArray(body.pnlData)).toBe(true);
  });
});

// ─── Layer 3: Background process — cron → agent-engine → DB ──────────────────
describe('API↔DB: cron loop (background process)', () => {
  it('rejects cron without auth header (401)', async () => {
    const { status } = await post('/api/cron/agent-loop', {});
    expect(status).toBe(401);
  });

  it('rejects cron with wrong secret', async () => {
    const { status } = await post('/api/cron/agent-loop', {}, 'Bearer wrong-secret');
    expect(status).toBe(401);
  });

  it('processes agent loop with valid auth and returns structured result', async () => {
    const { status, body } = await post(
      '/api/cron/agent-loop',
      {},
      `Bearer ${CRON_SECRET}`
    );
    expect(status).toBe(200);
    expect(body).toHaveProperty('processed');
    expect(body).toHaveProperty('results');
    expect(Array.isArray(body.results)).toBe(true);
    expect(typeof body.processed).toBe('number');
  });

  it('cron result outcomes are valid values', async () => {
    const { body } = await post('/api/cron/agent-loop', {}, `Bearer ${CRON_SECRET}`);
    const validOutcomes = ['buy', 'sell', 'hold', 'blocked', 'error', 'skipped'];
    for (const result of body.results) {
      expect(validOutcomes).toContain(result.outcome);
    }
  });
});

// ─── Layer 4: Policy creation ↔ DB ───────────────────────────────────────────
describe('API↔DB: policy/create', () => {
  it('creates a policy and returns structured rules', async () => {
    const { status, body } = await post('/api/policy/create', {
      strategyText: 'Buy SOL when RSI is below 30. Max 0.5 SOL per trade. Daily limit 2 SOL.',
    });
    expect(status).toBe(200);
    expect(body).toHaveProperty('rules');
    expect(Array.isArray(body.rules)).toBe(true);
    expect(body.rules.length).toBeGreaterThan(0);
  });

  it('returned policy rules have type field', async () => {
    const { body } = await post('/api/policy/create', {
      strategyText: 'Conservative DCA: buy 0.1 SOL daily',
    });
    for (const rule of body.rules) {
      expect(rule).toHaveProperty('type');
    }
  });

  it('returns 400 for missing strategyText', async () => {
    const { status } = await post('/api/policy/create', {});
    expect(status).toBe(400);
  });
});

// ─── Layer 5: Error propagation ───────────────────────────────────────────────
describe('API error propagation', () => {
  it('returns 404 for non-existent agent', async () => {
    const { status } = await get('/api/agent/nonexistent-agent-id-99999');
    expect(status).toBe(404);
  });

  it('returns 400 for agent create with missing required fields', async () => {
    const { status } = await post('/api/agent/create', { name: 'No wallet or strategy' });
    expect(status).toBe(400);
  });
});
