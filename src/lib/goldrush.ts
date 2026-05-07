// GoldRush (Covalent) Unified API — live on-chain portfolio + trade verification
const GOLDRUSH_API_KEY = process.env.GOLDRUSH_API_KEY || '';
const BASE_URL = 'https://api.covalenthq.com/v1';

export interface TokenBalance {
  symbol: string;
  balance: number;
  quoteUsd: number;
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
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${GOLDRUSH_API_KEY}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate: 30 },
  });
  if (!res.ok) throw new Error(`GoldRush ${res.status}: ${await res.text()}`);
  return res.json();
}

export async function getWalletPortfolio(walletAddress: string): Promise<GoldRushPortfolio> {
  try {
    const data = await grFetch(`/solana-mainnet/address/${walletAddress}/balances_v2/`);
    const items: TokenBalance[] = (data.data?.items ?? []).map(
      (item: Record<string, unknown>) => {
        const decimals = Number(item.contract_decimals ?? 9);
        const balance = Number(item.balance ?? 0) / Math.pow(10, decimals);
        return {
          symbol: String(item.contract_ticker_symbol ?? 'UNKNOWN'),
          balance,
          quoteUsd: Number(item.quote ?? 0),
        };
      }
    );

    const sol = items.find((i) => i.symbol === 'SOL')?.balance ?? 0;
    const usdc = items.find((i) => i.symbol === 'USDC')?.balance ?? 0;
    const totalUsdValue = items.reduce((sum, i) => sum + i.quoteUsd, 0);

    return { sol, usdc, totalUsdValue, items, source: 'goldrush' };
  } catch {
    // Graceful fallback for devnet wallets (GoldRush is mainnet-focused)
    return { sol: 2, usdc: 150, totalUsdValue: 300, items: [], source: 'mock' };
  }
}

export async function verifyTradeOnChain(
  walletAddress: string,
  txId: string
): Promise<boolean> {
  try {
    const data = await grFetch(
      `/solana-mainnet/address/${walletAddress}/transactions_v3/?page-size=25`
    );
    const txs: Array<Record<string, unknown>> = data.data?.items ?? [];
    return txs.some((tx) => tx.tx_hash === txId);
  } catch {
    return false;
  }
}

// Token price feed — augments CoinGecko for RSI calculation
export async function getTokenPriceUsd(symbol: string): Promise<number | null> {
  try {
    const mint = symbol === 'SOL' ? 'So11111111111111111111111111111111111111112' : null;
    if (!mint) return null;
    const data = await grFetch(`/pricing/historical_by_addresses_v2/solana-mainnet/USD/${mint}/`);
    const items: Array<Record<string, unknown>> = data.data?.[0]?.prices ?? [];
    const latest = items[items.length - 1];
    return latest ? Number(latest.price) : null;
  } catch {
    return null;
  }
}
