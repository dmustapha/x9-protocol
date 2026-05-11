const JUPITER_BASE = 'https://api.jup.ag/swap/v1';
const JUPITER_TIMEOUT_MS = 15_000;

function jupFetch(url: string, init?: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), JUPITER_TIMEOUT_MS);
  return fetch(url, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

export async function getSwapQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: number = 50
): Promise<unknown> {
  const res = await jupFetch(
    `${JUPITER_BASE}/quote?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=${slippageBps}`
  );
  if (!res.ok) throw new Error(`Jupiter quote failed: ${res.status}`);
  return res.json();
}

export async function getSwapTransaction(
  quoteResponse: unknown,
  userPublicKey: string
): Promise<string> {
  const res = await jupFetch(`${JUPITER_BASE}/swap`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      quoteResponse,
      userPublicKey,
      wrapAndUnwrapSol: true,
      dynamicComputeUnitLimit: true,
    }),
  });
  if (!res.ok) throw new Error(`Jupiter swap failed: ${res.status}`);
  const data = await res.json();
  return data.swapTransaction; // base64 unsigned transaction
}
