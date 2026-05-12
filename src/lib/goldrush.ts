// GoldRush (Covalent) Unified API — live on-chain portfolio + trade verification
const GOLDRUSH_API_KEY = process.env.GOLDRUSH_API_KEY || '';
const BASE_URL = 'https://api.covalenthq.com/v1';

// Known mint addresses used to match tokens by address, not symbol
const SOL_MINT = 'So11111111111111111111111111111111111111112';
const USDC_DEVNET_MINT = '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU';
const USDC_MAINNET_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
const GR_TIMEOUT_MS = 10_000;

// Derive chain slug from SOLANA_NETWORK env var.
// GoldRush slugs: 'solana-mainnet' | 'solana-devnet'
const _network = process.env.SOLANA_NETWORK || 'mainnet-beta';
const SOLANA_CHAIN = _network === 'devnet' ? 'solana-devnet' : 'solana-mainnet';

export interface TokenBalance {
  symbol: string;
  balance: number;
  quoteUsd: number;
  contractAddress?: string;
}

export interface GoldRushPortfolio {
  sol: number;
  usdc: number;
  totalUsdValue: number;
  items: TokenBalance[];
  source: 'goldrush' | 'mock';
}

async function grFetch(path: string) {
  if (!GOLDRUSH_API_KEY) throw new Error('GOLDRUSH_API_KEY not configured');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GR_TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      headers: {
        Authorization: `Bearer ${GOLDRUSH_API_KEY}`,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`GoldRush ${res.status}: ${await res.text()}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

const RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

async function rpcCall(method: string, params: unknown[]): Promise<unknown> {
  const res = await fetch(RPC_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
    cache: 'no-store',
  });
  const data = await res.json();
  return data?.result;
}

async function getSolBalanceRpc(walletAddress: string): Promise<number> {
  const result = await rpcCall('getBalance', [walletAddress, { commitment: 'confirmed' }]) as { value?: number } | null;
  return (result?.value ?? 0) / 1e9;
}

async function getUsdcBalanceRpc(walletAddress: string): Promise<number> {
  // Try mainnet USDC first, then devnet
  for (const mint of [USDC_MAINNET_MINT, USDC_DEVNET_MINT]) {
    try {
      const result = await rpcCall('getTokenAccountsByOwner', [
        walletAddress,
        { mint },
        { encoding: 'jsonParsed', commitment: 'confirmed' },
      ]) as { value?: { account: { data: { parsed: { info: { tokenAmount: { uiAmount: number } } } } } }[] } | null;
      const accounts = result?.value ?? [];
      if (accounts.length > 0) {
        return accounts[0].account.data.parsed.info.tokenAmount.uiAmount;
      }
    } catch { /* try next mint */ }
  }
  return 0;
}

async function getSolPriceUsd(): Promise<number> {
  try {
    const res = await fetch('https://price.jup.ag/v6/price?ids=So11111111111111111111111111111111111111112', { cache: 'no-store' });
    const data = await res.json();
    return data?.data?.['So11111111111111111111111111111111111111112']?.price ?? 0;
  } catch { return 0; }
}

export async function getWalletPortfolio(walletAddress: string): Promise<GoldRushPortfolio> {
  // Always fetch RPC balances in parallel — they're the source of truth.
  const [solRpc, usdcRpc, solPrice] = await Promise.all([
    getSolBalanceRpc(walletAddress).catch(() => 0),
    getUsdcBalanceRpc(walletAddress).catch(() => 0),
    getSolPriceUsd().catch(() => 0),
  ]);

  try {
    const data = await grFetch(`/${SOLANA_CHAIN}/address/${walletAddress}/balances_v2/`);
    const items: TokenBalance[] = (data.data?.items ?? []).map(
      (item: Record<string, unknown>) => {
        const decimals = Number(item.contract_decimals ?? 9);
        const balance = Number(item.balance ?? 0) / Math.pow(10, decimals);
        return {
          symbol: String(item.contract_ticker_symbol ?? 'UNKNOWN'),
          balance,
          quoteUsd: Number(item.quote ?? 0),
          contractAddress: String(item.contract_address ?? ''),
        };
      }
    );

    // GoldRush for token list; RPC values override when GoldRush returns 0 for a funded wallet.
    const solGr = items.find((i) => i.contractAddress === SOL_MINT)?.balance
      ?? items.find((i) => i.symbol === 'SOL')?.balance ?? 0;
    const usdcGr = items.find((i) => i.contractAddress === USDC_DEVNET_MINT || i.contractAddress === USDC_MAINNET_MINT)?.balance
      ?? items.find((i) => i.symbol === 'USDC')?.balance ?? 0;

    const sol = solGr > 0 ? solGr : solRpc;
    const usdc = usdcGr > 0 ? usdcGr : usdcRpc;
    const totalUsdValue = sol * solPrice + usdc;

    return { sol, usdc, totalUsdValue, items, source: 'goldrush' };
  } catch (err) {
    console.warn('[goldrush] getWalletPortfolio API failed, using RPC values:', String(err));
    return {
      sol: solRpc,
      usdc: usdcRpc,
      totalUsdValue: solRpc * solPrice + usdcRpc,
      items: [],
      source: 'mock',
    };
  }
}

// GoldRush does not support transactions_v3 or historical pricing for Solana.
// Trade verification uses the Solana JSON-RPC getSignatureStatuses endpoint instead.
export async function verifyTradeOnChain(
  _walletAddress: string,
  txId: string
): Promise<boolean> {
  try {
    const rpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
    const res = await fetch(rpc, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignatureStatuses',
        params: [[txId], { searchTransactionHistory: true }],
      }),
    });
    const data = await res.json();
    const status = data?.result?.value?.[0];
    return status !== null && status !== undefined && !status.err;
  } catch {
    return false;
  }
}

// GoldRush historical pricing is not supported for Solana.
// Price feeds are handled by CoinGecko (coingecko.ts).
export async function getTokenPriceUsd(_symbol: string): Promise<number | null> {
  return null;
}
