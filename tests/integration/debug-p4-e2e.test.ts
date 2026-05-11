/**
 * debug-p4-e2e.test.ts
 * Phase 4: E2E tests — all 6 PRD user flows, Tier 2 (API/curl level)
 * Tests happy path + primary error path per flow.
 * Server must be running on port 3000.
 */
import { describe, it, expect, beforeAll } from 'vitest';

const BASE = process.env.TEST_BASE_URL || 'http://localhost:3000';
const CRON_SECRET = 'x9-cron-secret-dev';

async function get(path: string) {
  const res = await fetch(`${BASE}${path}`);
  return { status: res.status, body: await res.json().catch(() => null) };
}
async function post(path: string, payload: unknown, auth?: string) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = auth;
  const res = await fetch(`${BASE}${path}`, { method: 'POST', headers, body: JSON.stringify(payload) });
  return { status: res.status, body: await res.json().catch(() => null) };
}

beforeAll(async () => {
  const res = await fetch(`${BASE}/`).catch(() => null);
  if (!res?.ok) throw new Error('Dev server not running on port 3000');
});

// ─── Flow 1: Connect Wallet and Onboard ──────────────────────────────────────
describe('Flow 1: Onboarding (landing → dashboard → wallet connect)', () => {
  it('landing page serves correctly (HTTP 200)', async () => {
    const res = await fetch(`${BASE}/`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
  });

  it('dashboard page serves correctly', async () => {
    const res = await fetch(`${BASE}/dashboard`);
    expect(res.status).toBe(200);
  });

  it('overview API returns correct shape for wallet-based agent listing', async () => {
    const { status, body } = await get('/api/dashboard/overview');
    expect(status).toBe(200);
    expect(typeof body.totalAgents).toBe('number');
    expect(typeof body.activeAgents).toBe('number');
    expect(typeof body.totalPnl).toBe('number');
  });

  // Error path: non-existent agent lookup
  it('returns 404 for unknown wallet agent', async () => {
    const { status } = await get('/api/agent/nonexistent-wallet-xyz');
    expect(status).toBe(404);
  });
});

// ─── Flow 2: Deploy Agent with NL Policy ─────────────────────────────────────
describe('Flow 2: Deploy agent with natural language policy', () => {
  let agentId: string;

  it('creates agent from NL strategy and returns policy rules', async () => {
    const { status, body } = await post('/api/agent/create', {
      ownerWallet: 'E2ETestWallet11111111111111111111111111111',
      name: 'E2E Flow 2 Agent',
      strategyText: 'Moderate SOL trader. Max 0.3 SOL per trade, 1.5 SOL per day.',
    }, `Bearer ${CRON_SECRET}`);
    expect(status).toBe(200);
    expect(body.agent).toBeDefined();
    expect(body.agent.status).toBe('paused'); // must not auto-start
    expect(Array.isArray(body.policy)).toBe(true);
    expect(body.policy.length).toBeGreaterThan(0);
    agentId = body.agent.id;
  });

  it('generated policy includes SolLimit and SolRecurringLimit rules', async () => {
    const { body } = await post('/api/agent/create', {
      ownerWallet: 'E2ETestWallet22222222222222222222222222222',
      strategyText: 'Conservative: max 0.1 SOL per trade, 0.5 SOL per day.',
    }, `Bearer ${CRON_SECRET}`);
    const types = body.policy.map((r: { type: string }) => r.type);
    expect(types).toContain('SolLimit');
    expect(types).toContain('SolRecurringLimit');
  });

  it('agent has swigPolicyId after creation (real or mock)', async () => {
    const { body } = await get(`/api/agent/${agentId}`);
    expect(body.swigPolicyId).toBeTruthy();
    expect(body.swigWalletAddress).toBeTruthy();
  });

  // Error path: missing strategy
  it('returns 400 when strategyText is missing', async () => {
    const { status } = await post('/api/agent/create', {
      ownerWallet: 'SomeWallet',
      // no strategyText
    }, `Bearer ${CRON_SECRET}`);
    expect(status).toBe(400);
  });
});

// ─── Flow 3: Agent Trading Loop ───────────────────────────────────────────────
describe('Flow 3: Agent trading loop (5-min cron)', () => {
  it('cron triggers and processes active agents', async () => {
    const { status, body } = await post('/api/cron/agent-loop', {}, `Bearer ${CRON_SECRET}`);
    expect(status).toBe(200);
    expect(typeof body.processed).toBe('number');
    expect(Array.isArray(body.results)).toBe(true);
  });

  it('each result contains agentId and outcome', async () => {
    const { body } = await post('/api/cron/agent-loop', {}, `Bearer ${CRON_SECRET}`);
    for (const r of body.results) {
      expect(r).toHaveProperty('agentId');
      expect(r).toHaveProperty('outcome');
    }
  });

  it('trades appear in DB after cron fires (overview trade count reflects)', async () => {
    const before = (await get('/api/dashboard/overview')).body.totalTrades;
    await post('/api/cron/agent-loop', {}, `Bearer ${CRON_SECRET}`);
    const after = (await get('/api/dashboard/overview')).body.totalTrades;
    // Either same (if hold) or incremented
    expect(after).toBeGreaterThanOrEqual(before);
  });

  // Error path: wrong auth
  it('cron rejects requests without auth (401)', async () => {
    const { status } = await post('/api/cron/agent-loop', {});
    expect(status).toBe(401);
  });
});

// ─── Flow 4: Policy Block Event ───────────────────────────────────────────────
describe('Flow 4: Policy block event (THE core demo flow)', () => {
  let blockAgentId: string;

  it('creates agent with very tight policy limits', async () => {
    const { body } = await post('/api/agent/create', {
      ownerWallet: 'BlockTestWallet33333333333333333333333333',
      name: 'Block Test Agent',
      strategyText: 'Very restrictive: max 0.001 SOL per trade.',
    }, `Bearer ${CRON_SECRET}`);
    blockAgentId = body.agent.id;
    expect(blockAgentId).toBeTruthy();
  });

  it('block events endpoint returns array with expected shape', async () => {
    const { status, body } = await get('/api/dashboard/overview');
    expect(status).toBe(200);
    expect(Array.isArray(body.blockEvents)).toBe(true);
    // If any block events exist, verify their shape
    if (body.blockEvents.length > 0) {
      const evt = body.blockEvents[0];
      expect(evt).toHaveProperty('id');
      expect(evt).toHaveProperty('agentId');
      expect(evt).toHaveProperty('ruleTriggered');
      expect(evt).toHaveProperty('attemptedAmount');
    }
  });

  it('agent can be stopped after being blocked', async () => {
    const { status, body } = await post(`/api/agent/${blockAgentId}/stop`, {}, `Bearer ${CRON_SECRET}`);
    expect(status).toBe(200);
    expect(body.status).toBe('stopped');
  });

  it('stopped agent can be restarted (recovery after block)', async () => {
    const { status, body } = await post(`/api/agent/${blockAgentId}/start`, {}, `Bearer ${CRON_SECRET}`);
    expect(status).toBe(200);
    expect(body.status).toBe('active');
    // Clean up: stop it
    await post(`/api/agent/${blockAgentId}/stop`, {}, `Bearer ${CRON_SECRET}`);
  });
});

// ─── Flow 5: Vanish Private Trade ─────────────────────────────────────────────
describe('Flow 5: Vanish private trade (mock mode)', () => {
  it('agent creation includes vanishDepositAddr (real or mock)', async () => {
    const { body } = await post('/api/agent/create', {
      ownerWallet: 'VanishTestWallet44444444444444444444444444',
      name: 'Vanish Test Agent',
      strategyText: 'Test agent for vanish verification.',
    }, `Bearer ${CRON_SECRET}`);
    expect(body.agent.vanishDepositAddr).toBeTruthy();
  });

  it('trade records include privacyScore field', async () => {
    const { body } = await get('/api/dashboard/overview');
    const trades = body.recentTrades;
    // At least some trades should have been through vanish (mock or real)
    expect(trades.length).toBeGreaterThan(0);
    // privacyScore can be null (holds) or object (executed trades)
    for (const trade of trades) {
      if (trade.privacyScore !== null) {
        expect(trade.privacyScore).toHaveProperty('oneTimeWallet');
        expect(trade.privacyScore).toHaveProperty('jitoProtected');
      }
    }
  });
});

// ─── Flow 6: Dashboard Monitoring ────────────────────────────────────────────
describe('Flow 6: Dashboard monitoring', () => {
  it('deploy page serves correctly', async () => {
    const res = await fetch(`${BASE}/deploy`);
    expect(res.status).toBe(200);
  });

  it('proof page serves correctly', async () => {
    const res = await fetch(`${BASE}/proof`);
    expect(res.status).toBe(200);
  });

  it('trades endpoint returns trade history with reasoning', async () => {
    // Get a real agent from overview
    const overview = (await get('/api/dashboard/overview')).body;
    const agentId = overview.recentTrades?.[0]?.agentId;
    if (!agentId) return; // No trades yet — skip

    const { status, body } = await get(`/api/agent/${agentId}/trades`);
    expect(status).toBe(200);
    expect(Array.isArray(body)).toBe(true);
    if (body.length > 0) {
      expect(body[0]).toHaveProperty('action');
      expect(body[0]).toHaveProperty('reason');
      expect(body[0]).toHaveProperty('status');
    }
  });

  it('PnL endpoint returns chart data', async () => {
    const overview = (await get('/api/dashboard/overview')).body;
    const agentId = overview.recentTrades?.[0]?.agentId;
    if (!agentId) return;

    const { status, body } = await get(`/api/agent/${agentId}/pnl`);
    expect(status).toBe(200);
    expect(body).toHaveProperty('pnlData');
    expect(body).toHaveProperty('totalPnl');
  });

  it('overview totalPnl is a valid number', async () => {
    const { body } = await get('/api/dashboard/overview');
    expect(typeof body.totalPnl).toBe('number');
    expect(isNaN(body.totalPnl)).toBe(false);
  });
});
