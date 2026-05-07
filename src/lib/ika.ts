// Ika — MPC threshold signing for policy-enforced cryptographic trade authorization
// Day 3 time-boxed feature. If not working by noon Day 3, keep existing Keypair signing.

const IKA_API_KEY = process.env.IKA_API_KEY || '';
const IKA_BASE_URL = 'https://api.ika.xyz/v1';

export interface IkaEnrollResult {
  ikaKeyId: string;
  threshold: number;
  shares: number;
}

async function ikaFetch(path: string, body?: unknown): Promise<Response> {
  return fetch(`${IKA_BASE_URL}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: {
      Authorization: `Bearer ${IKA_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

// Enroll an agent key into Ika MPC — splits the key into threshold shares
// Policy compliance is enforced at the cryptographic layer before signing
export async function enrollAgent(
  agentId: string,
  agentPublicKey: string
): Promise<IkaEnrollResult | null> {
  if (!IKA_API_KEY) return null;
  try {
    const res = await ikaFetch('/enroll', {
      agentId,
      publicKey: agentPublicKey,
      threshold: 2,
      shares: 3,
      policyConstraints: {
        allowedActions: ['swap', 'transfer'],
        maxAmountPerTx: 5_000_000_000, // 5 SOL in lamports
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    return { ikaKeyId: data.keyId, threshold: data.threshold, shares: data.shares };
  } catch {
    return null;
  }
}

// Sign a transaction via Ika MPC (threshold signing with policy validation)
// Ika validates the transaction against policy constraints before signing
export async function signWithIka(
  ikaKeyId: string,
  transactionBase64: string
): Promise<string | null> {
  if (!IKA_API_KEY || !ikaKeyId) return null;
  try {
    const res = await ikaFetch('/sign', {
      keyId: ikaKeyId,
      transaction: transactionBase64,
      network: 'solana-devnet',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.signedTransaction ?? null;
  } catch {
    return null;
  }
}

export function isIkaConfigured(): boolean {
  return Boolean(IKA_API_KEY);
}
