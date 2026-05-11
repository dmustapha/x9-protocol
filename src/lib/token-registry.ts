import type { TradeableToken } from '@/types';

// Hardcoded registry of well-known Solana tokens.
// Mint addresses on Solana are immutable — this registry stores metadata, not prices.
// Tiers control Jupiter slippage: blue_chip=50bps, mid=200bps, degen=500bps.
// If a token is not in this registry, Sonnet acts as fallback at deploy time.
// Wrong mints fail gracefully at Jupiter quote time (before any transaction).

const REGISTRY: TradeableToken[] = [
  // ── Blue chip ──
  { symbol: 'SOL',     mint: 'So11111111111111111111111111111111111111112',    decimals: 9, tier: 'blue_chip' },
  { symbol: 'USDC',    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', decimals: 6, tier: 'blue_chip' },
  { symbol: 'USDT',    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', decimals: 6, tier: 'blue_chip' },
  { symbol: 'JUP',     mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', decimals: 6, tier: 'blue_chip' },
  { symbol: 'JTO',     mint: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL', decimals: 9, tier: 'blue_chip' },
  { symbol: 'RAY',     mint: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', decimals: 6, tier: 'blue_chip' },
  { symbol: 'RENDER',  mint: 'rndrizKT3MK1iimdxRdWabcF7Zg7AR5T4nud4EkHBof',  decimals: 8, tier: 'blue_chip' },
  { symbol: 'PYTH',    mint: 'HZ1JovNiVvGrG3LQQr3v7wMQLKEHwwvMQCUvOKXzVPbX', decimals: 6, tier: 'blue_chip' },
  { symbol: 'DRIFT',   mint: 'DriFtupJYLTosbwoN8koMbEYSx54aFAVLDWnroEj22Pm', decimals: 6, tier: 'blue_chip' },
  { symbol: 'ORCA',    mint: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1eBkZ3H',  decimals: 6, tier: 'blue_chip' },

  // ── Mid tier ──
  { symbol: 'BONK',    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', decimals: 5, tier: 'mid' },
  { symbol: 'WIF',     mint: 'EKpQGSJtjMFqKZ9KQanSqYXRcF8fBopzLHYxdM65zcjm', decimals: 6, tier: 'mid' },
  { symbol: 'POPCAT',  mint: '7GCihgDB8fe6KNjn2MYtkzZcRjQy3t9GHdC8uHYmW2hr', decimals: 9, tier: 'mid' },
  { symbol: 'TRUMP',   mint: '6p6xgHyF7AeE6TZkSmFsko444wqoP15icUSqi2jfGiPN', decimals: 6, tier: 'mid' },
  { symbol: 'MELANIA', mint: 'FUAfBo2jgks6gB4Z8VhJVDkYhFuEfcmxSmujUr2K1aba', decimals: 6, tier: 'mid' },
  { symbol: 'BOME',    mint: 'ukHH6c7mMyiWCf1b9pnWe25TSpkDDt3H5pQZgZ74J82', decimals: 6, tier: 'mid' },
  { symbol: 'MEW',     mint: 'MEW1gQWJ3nEXg2qgSCAnJvx2bYosmwcAJ4CjYHf2Gxq',  decimals: 6, tier: 'mid' },
  { symbol: 'SAMO',    mint: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU', decimals: 9, tier: 'mid' },
  { symbol: 'KMNO',    mint: 'KMNo3nJsBXfcpJTVhZcXLW7RmTwTt4GVFE7suUBo9sS',  decimals: 6, tier: 'mid' },
  { symbol: 'ZEUS',    mint: 'ZEUS1aR7aX8DffMddN7A7BVQK7pgLNPWmKDQRMUUv1h', decimals: 6, tier: 'mid' },
  { symbol: 'ATLAS',   mint: 'ATLASXmbPQxBUYbxPsV97usA3fPQYEqzQBUHgiFCUsXx', decimals: 8, tier: 'mid' },
  { symbol: 'POLIS',   mint: 'poLisWXnNRwC6oBu1vHiuKQzFjGL4XDSu4g9qjz9qVk', decimals: 8, tier: 'mid' },
  { symbol: 'C98',     mint: 'C98A4nkJXhpVZNAZdHUA95RpTF3T4whtQubL3YobiUX9', decimals: 6, tier: 'mid' },
  { symbol: 'GMT',     mint: '7i5KKsX2weiTkry7jA4ZwSuXGhs5eJBEjY8vVxR4pfRx', decimals: 9, tier: 'mid' },
  { symbol: 'GST',     mint: 'AFbX8oGjGpmVFywabFkpiYHpne2FSLQKGKce764W6HDo', decimals: 9, tier: 'mid' },
  { symbol: 'STEP',    mint: 'StepAscQoEioFxxWGnh2sLBDFp9d8rvKz2Yp39iDpyT',  decimals: 9, tier: 'mid' },

  // ── Degen tier ──
  { symbol: 'FARTCOIN', mint: '9BB6NFEcjBCtnNLFko2FqVQBq8HHM13kCyYcdQbgpump', decimals: 6, tier: 'degen' },
  { symbol: 'TREMP',    mint: 'FU1q8vJpZNUrmqsciSjp8bAKKidGsLmouB8CBdf8TKQv', decimals: 6, tier: 'degen' },
  { symbol: 'BRETT',    mint: 'BRETTqYJxZ6kX7RBqKMmVYsLQd9DWjHnYZGk3FKdRmC', decimals: 6, tier: 'degen' },
  { symbol: 'MEME',     mint: 'MoEjQLCDy4FVSNBQMTS2XeFPHCFVjKrxzNvPyM6RRMZ', decimals: 6, tier: 'degen' },
  { symbol: 'MOTHER',   mint: '3S8qX1MsMqRbiwKg2cQyx7nis1oHMgaCuc9c4VfvVdPN', decimals: 6, tier: 'degen' },
  { symbol: 'CLOUD',    mint: 'CLoakyxVZxLCMxAJd7Wm6ATZN9JQmBpY9oWJunH3xE',  decimals: 9, tier: 'degen' },
];

// Lookup maps built once at module load
const BY_MINT = new Map<string, TradeableToken>(REGISTRY.map(t => [t.mint, t]));
const BY_SYMBOL = new Map<string, TradeableToken>(REGISTRY.map(t => [t.symbol.toUpperCase(), t]));

export function getTokenByMint(mint: string): TradeableToken | undefined {
  return BY_MINT.get(mint);
}

export function getTokenBySymbol(symbol: string): TradeableToken | undefined {
  return BY_SYMBOL.get(symbol.toUpperCase());
}

export { REGISTRY as TOKEN_REGISTRY };
