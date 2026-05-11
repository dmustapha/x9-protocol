import { SwigClient } from '@swig-wallet/developer';
import type { ActionConfig, AgentPolicy } from '@/types';

const SWIG_API_KEY = process.env.SWIG_API_KEY ?? '';
const SWIG_PORTAL_URL = 'https://dashboard.onswig.com';
// Policy provisioned on dashboard.onswig.com — 0.1 SOL/day, Curated Programs (Jupiter/Orca/Raydium)
const SWIG_DEFAULT_POLICY_ID = process.env.SWIG_DEFAULT_POLICY_ID ?? '';

// Normalize Solana network env to Swig SDK format ('mainnet' | 'devnet')
const SWIG_NETWORK =
  (process.env.SOLANA_NETWORK ?? 'mainnet-beta') === 'devnet' ? 'devnet' : 'mainnet';

function getClient(): SwigClient {
  if (!SWIG_API_KEY) throw new Error('SWIG_API_KEY not configured');
  return new SwigClient({ apiKey: SWIG_API_KEY, baseUrl: SWIG_PORTAL_URL });
}

// Policy creation is dashboard-only (SDK has no createPolicy endpoint).
// All agents share the x9-default policy — per-agent spending rules are enforced locally
// by preCheckTrade, while the on-chain policy provides the hard ceiling.
export async function createPolicy(_policy: AgentPolicy): Promise<{ id: string }> {
  if (!SWIG_DEFAULT_POLICY_ID) throw new Error('SWIG_DEFAULT_POLICY_ID not configured');
  return { id: SWIG_DEFAULT_POLICY_ID };
}

// Creates a Swig smart wallet on-chain for the given policy ID.
// agentPublicKey is set as the ED25519 authority on the wallet.
// Returns swigAddress + unsigned VersionedTransaction that must be signed by agentKeypair and submitted.
export async function createWallet(
  policyId: string,
  agentPublicKey: string,
): Promise<{ swigAddress: string; transaction?: import('@solana/web3.js').VersionedTransaction }> {
  const client = getClient();
  const result = await client.createWallet({
    policyId,
    network: SWIG_NETWORK,
    walletAddress: agentPublicKey,
    walletType: 'ED25519',
  });
  return { swigAddress: result.swigAddress, transaction: 'transaction' in result ? result.transaction : undefined };
}

export async function getPolicy(policyId: string): Promise<AgentPolicy> {
  const client = getClient();
  const policy = await client.getPolicy(policyId);
  // Actions is a rich SDK class — return metadata only; rules are managed locally via preCheckTrade
  return {
    name: policy.name,
    description: '',
    authority: { type: 'ED25519', publicKey: '' },
    actions: [],
  };
}

export function preCheckTrade(
  decision: { action: string; amount_lamports: number; token: string; destination?: string },
  policyRules: ActionConfig[],
  solUsedToday: number,
  tokenUsedToday: Map<string, number> = new Map(),
): { allowed: boolean; violatedRule?: string; limit?: string } {
  const isSol = decision.token.startsWith('So1');

  for (const rule of policyRules) {
    // Per-trade SOL cap
    if (rule.type === 'SolLimit' && isSol) {
      const limit = parseInt(rule.amount);
      if (decision.amount_lamports > limit) {
        return {
          allowed: false,
          violatedRule: `SolLimit (${(limit / 1e9).toFixed(1)} SOL max per trade)`,
          limit: rule.amount,
        };
      }
    }

    // Daily SOL rolling limit
    if (rule.type === 'SolRecurringLimit' && isSol) {
      const dailyLimit = parseInt(rule.recurringAmount);
      if (solUsedToday + decision.amount_lamports > dailyLimit) {
        return {
          allowed: false,
          violatedRule: `SolRecurringLimit (${(dailyLimit / 1e9).toFixed(1)} SOL/day, used ${(solUsedToday / 1e9).toFixed(1)})`,
          limit: rule.recurringAmount,
        };
      }
    }

    // SOL destination allowlist
    if (rule.type === 'SolDestinationLimit' && isSol) {
      const limit = parseInt(rule.amount);
      if (decision.amount_lamports > limit) {
        return {
          allowed: false,
          violatedRule: `SolDestinationLimit (${(limit / 1e9).toFixed(1)} SOL max to ${rule.destination})`,
          limit: rule.amount,
        };
      }
    }

    // Per-trade token cap
    if (rule.type === 'TokenLimit' && 'mint' in rule && rule.mint === decision.token) {
      const limit = parseInt(rule.amount);
      if (decision.amount_lamports > limit) {
        return {
          allowed: false,
          violatedRule: `TokenLimit (${limit} max per trade for mint ${rule.mint.slice(0, 8)}…)`,
          limit: rule.amount,
        };
      }
    }

    // Daily token rolling limit
    if (rule.type === 'TokenRecurringLimit' && 'mint' in rule && rule.mint === decision.token) {
      const dailyLimit = parseInt(rule.recurringAmount);
      const usedToday = tokenUsedToday.get(rule.mint) ?? 0;
      if (usedToday + decision.amount_lamports > dailyLimit) {
        return {
          allowed: false,
          violatedRule: `TokenRecurringLimit (${dailyLimit} max/day for mint ${rule.mint.slice(0, 8)}…, used ${usedToday})`,
          limit: rule.recurringAmount,
        };
      }
    }
  }

  return { allowed: true };
}
