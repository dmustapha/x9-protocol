// GoldRush (Covalent) Unified API — live on-chain portfolio + trade verification
const GOLDRUSH_API_KEY = process.env.GOLDRUSH_API_KEY || '';
const BASE_URL = 'https://api.covalenthq.com/v1';
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
      next: { revalidate: 30 },
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`GoldRush ${res.status}: ${await res.text()}`);
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function getWalletPortfolio(walletAddress: string): Promise<GoldRushPortfolio> {
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

    const sol = items.find((i) => i.symbol === 'SOL')?.balance ?? 0;
    const usdc = items.find((i) => i.symbol === 'USDC')?.balance ?? 0;
    const totalUsdValue = items.reduce((sum, i) => sum + i.quoteUsd, 0);

    return { sol, usdc, totalUsdValue, items, source: 'goldrush' };
  } catch (err) {
    // Return zero balances so Claude doesn't trade on fabricated portfolio data.
    console.warn('[goldrush] getWalletPortfolio failed, using zero balances:', String(err));
    return { sol: 0, usdc: 0, totalUsdValue: 0, items: [], source: 'mock' };
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
