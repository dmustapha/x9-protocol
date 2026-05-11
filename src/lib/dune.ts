// Dune Analytics — server-side analytics engine with Prisma cache (24h TTL)
import { db } from './db';

const DUNE_API_KEY = process.env.DUNE_API_KEY || '';
const BASE_URL = 'https://api.dune.com/api/v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Dune query IDs (env-configurable; fall back to derived DB analytics)
const QUERY_IDS = {
  tradeVolume: process.env.DUNE_QUERY_TRADE_VOLUME || '',
  buySellRatio: process.env.DUNE_QUERY_BUY_SELL_RATIO || '',
  pnlCurve: process.env.DUNE_QUERY_PNL_CURVE || '',
  txHistory: process.env.DUNE_QUERY_TX_HISTORY || '',
};

export type DuneQueryKey = keyof typeof QUERY_IDS;

export interface DuneResult {
  queryId: string;
  rows: Record<string, unknown>[];
  source: 'dune' | 'derived' | 'cache';
  executionId?: string;
}

async function duneFetch(path: string, options?: RequestInit) {
  if (!DUNE_API_KEY) throw new Error('DUNE_API_KEY not configured');
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'X-Dune-API-Key': DUNE_API_KEY,
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`Dune API ${res.status}: ${await res.text()}`);
  return res.json();
}

async function getCached(agentId: string, queryId: string): Promise<DuneResult | null> {
  const cached = await db.duneCache.findUnique({ where: { agentId_queryId: { agentId, queryId } } });
  if (!cached) return null;
  const age = Date.now() - cached.cachedAt.getTime();
  if (age > CACHE_TTL_MS) return null;
  return { queryId, rows: JSON.parse(cached.result), source: 'cache' };
}

async function setCached(agentId: string, queryId: string, rows: Record<string, unknown>[]) {
  await db.duneCache.upsert({
    where: { agentId_queryId: { agentId, queryId } },
    create: { agentId, queryId, result: JSON.stringify(rows) },
    update: { result: JSON.stringify(rows), cachedAt: new Date() },
  });
}

// Fetch a Dune query result (with caching)
// Execute a parameterized Dune query for a specific wallet and poll for results.
// Gives up after DUNE_EXEC_TIMEOUT_MS and returns null — caller falls back to derived.
const DUNE_EXEC_TIMEOUT_MS = 8_000;
const DUNE_POLL_INTERVAL_MS = 1_500;

async function executeDuneQuery(
  queryId: string,
  walletAddress: string
): Promise<Record<string, unknown>[] | null> {
  // Start execution with wallet parameter
  const exec = await duneFetch(`/query/${queryId}/execute`, {
    method: 'POST',
    body: JSON.stringify({
      query_parameters: [{ key: 'wallet_address', value: walletAddress, type: 'text' }],
      performance: 'medium',
    }),
  });
  const executionId: string = exec.execution_id;
  if (!executionId) return null;

  // Poll until complete or timeout
  const deadline = Date.now() + DUNE_EXEC_TIMEOUT_MS;
  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, DUNE_POLL_INTERVAL_MS));
    const status = await duneFetch(`/execution/${executionId}/results`);
    if (status.state === 'QUERY_STATE_COMPLETED') {
      return status.result?.rows ?? [];
    }
    if (status.state === 'QUERY_STATE_FAILED' || status.state === 'QUERY_STATE_CANCELLED') {
      return null;
    }
  }
  return null; // timed out
}

async function fetchDuneQuery(
  agentId: string,
  queryKey: DuneQueryKey,
  walletAddress?: string
): Promise<DuneResult> {
  const queryId = QUERY_IDS[queryKey];
  const cacheKey = `${queryKey}:${agentId}`;

  const cached = await getCached(agentId, cacheKey);
  if (cached) return cached;

  // Fall back to DB-derived analytics when Dune key/query not configured
  if (!DUNE_API_KEY || !queryId || !walletAddress) {
    const rows = await derivedAnalytics(agentId, queryKey);
    await setCached(agentId, cacheKey, rows);
    return { queryId: queryKey, rows, source: 'derived' };
  }

  try {
    const rows = await executeDuneQuery(queryId, walletAddress);
    if (rows !== null) {
      await setCached(agentId, cacheKey, rows);
      return { queryId, rows, source: 'dune' };
    }
  } catch {
    // fall through to derived
  }

  // Graceful fallback to derived analytics
  const rows = await derivedAnalytics(agentId, queryKey);
  await setCached(agentId, cacheKey, rows);
  return { queryId: queryKey, rows, source: 'derived' };
}

// DB-derived analytics — works without Dune API key (hackathon demo fallback)
async function derivedAnalytics(
  agentId: string,
  queryKey: DuneQueryKey
): Promise<Record<string, unknown>[]> {
  const trades = await db.trade.findMany({
    where: { agentId, status: 'executed' },
    orderBy: { createdAt: 'asc' },
  });

  switch (queryKey) {
    case 'tradeVolume': {
      const byDay = new Map<string, number>();
      for (const t of trades) {
        const day = t.createdAt.toISOString().slice(0, 10);
        byDay.set(day, (byDay.get(day) ?? 0) + parseInt(t.amountLamports));
      }
      return Array.from(byDay.entries()).map(([date, volume]) => ({ date, volume_lamports: volume }));
    }
    case 'buySellRatio': {
      const buys = trades.filter((t) => t.action === 'buy').length;
      const sells = trades.filter((t) => t.action === 'sell').length;
      const holds = trades.filter((t) => t.action === 'hold').length;
      return [{ buys, sells, holds, ratio: sells > 0 ? (buys / sells).toFixed(2) : 'N/A' }];
    }
    case 'pnlCurve': {
      let cumPnl = 0;
      return trades.map((t) => {
        cumPnl += t.pnlDelta ?? 0;
        return { timestamp: t.createdAt.toISOString(), pnl_sol: cumPnl.toFixed(4) };
      });
    }
    case 'txHistory': {
      return trades.map((t) => ({
        tx_id: t.vanishTxId ?? t.id,
        action: t.action,
        token: t.token,
        amount_lamports: t.amountLamports,
        on_chain_verified: t.onChainVerified,
        timestamp: t.createdAt.toISOString(),
      }));
    }
  }
}

// Fetch all 4 analytics queries for an agent
export async function getAgentAnalytics(agentId: string) {
  // Look up agent wallet so Dune queries can be parameterized per-wallet
  const agent = await db.agent.findUnique({ where: { id: agentId }, select: { agentPublicKey: true } });
  const walletAddress = agent?.agentPublicKey ?? undefined;

  const [tradeVolume, buySellRatio, pnlCurve, txHistory] = await Promise.all([
    fetchDuneQuery(agentId, 'tradeVolume', walletAddress),
    fetchDuneQuery(agentId, 'buySellRatio', walletAddress),
    fetchDuneQuery(agentId, 'pnlCurve', walletAddress),
    fetchDuneQuery(agentId, 'txHistory', walletAddress),
  ]);
  return { tradeVolume, buySellRatio, pnlCurve, txHistory };
}

// Aggregate analytics across all agents (for /proof page)
export async function getAggregateAnalytics() {
  const agents = await db.agent.findMany({ select: { id: true, name: true, snsDomain: true } });
  const results = await Promise.all(
    agents.map(async (a) => ({
      agentId: a.id,
      agentName: a.name,
      snsDomain: a.snsDomain,
      analytics: await getAgentAnalytics(a.id),
    }))
  );
  return results;
}
