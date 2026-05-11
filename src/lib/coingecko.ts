const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';
const JUPITER_PRICE_BASE = 'https://api.jup.ag/price/v2';
const COINGECKO_TIMEOUT_MS = 8_000;

let cachedPrices: { sol: number; usdc: number; fetchedAt: number } | null = null;
const CACHE_TTL_MS = 30_000; // 30s cache to respect rate limits

export async function fetchPrices(): Promise<{ sol: number; usdc: number }> {
  if (cachedPrices && Date.now() - cachedPrices.fetchedAt < CACHE_TTL_MS) {
    return { sol: cachedPrices.sol, usdc: cachedPrices.usdc };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COINGECKO_TIMEOUT_MS);

  const res = await fetch(
    `${COINGECKO_BASE}/simple/price?ids=solana,usd-coin&vs_currencies=usd`,
    { next: { revalidate: 60 }, signal: controller.signal }
  ).finally(() => clearTimeout(timer));

  if (!res.ok) {
    if (cachedPrices) return { sol: cachedPrices.sol, usdc: cachedPrices.usdc };
    throw new Error(`CoinGecko API error: ${res.status}`);
  }

  const data = await res.json();
  cachedPrices = {
    sol: data.solana.usd,
    usdc: data['usd-coin'].usd,
    fetchedAt: Date.now(),
  };

  return { sol: cachedPrices.sol, usdc: cachedPrices.usdc };
}

// Fetch USD prices for arbitrary Solana token mints via Jupiter Price API.
// Returns a map of mint → USD price. Mints not found in Jupiter return no entry.
export async function fetchTokenPrices(mints: string[]): Promise<Record<string, number>> {
  if (mints.length === 0) return {};
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), COINGECKO_TIMEOUT_MS);
  try {
    const res = await fetch(
      `${JUPITER_PRICE_BASE}?ids=${mints.join(',')}`,
      { signal: controller.signal }
    );
    if (!res.ok) return {};
    const data = await res.json();
    const prices: Record<string, number> = {};
    for (const [mint, info] of Object.entries(data.data ?? {})) {
      const price = (info as { price?: number }).price;
      if (typeof price === 'number' && price > 0) {
        prices[mint] = price;
      }
    }
    return prices;
  } catch {
    return {};
  } finally {
    clearTimeout(timer);
  }
}
