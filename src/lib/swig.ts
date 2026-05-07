import type { ActionConfig, AgentPolicy } from '@/types';

const SWIG_BASE = 'https://dashboard.onswig.com';
const SWIG_API_KEY = process.env.SWIG_API_KEY!;

async function swigFetch(path: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  let res: Response;
  try {
    res = await fetch(`${SWIG_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${SWIG_API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  } finally {
    clearTimeout(timeout);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Swig API error ${res.status}: ${body}`);
  }

  return res.json();
}

export async function createPolicy(policy: AgentPolicy): Promise<{ id: string }> {
  return swigFetch('/api/v1/policies', {
    method: 'POST',
    body: JSON.stringify(policy),
  });
}

export async function createWallet(policyId: string): Promise<{ swigAddress: string }> {
  const result = await swigFetch('/api/v1/wallets', {
    method: 'POST',
    body: JSON.stringify({ policyId, network: 'devnet' }),
  });
  return { swigAddress: result.data?.swigAddress || result.swigAddress };
}

export async function getPolicy(policyId: string): Promise<AgentPolicy> {
  return swigFetch(`/api/v1/policies/${policyId}`);
}

export function preCheckTrade(
  decision: { action: string; amount_lamports: number; token: string },
  policyRules: ActionConfig[],
  solUsedToday: number
): { allowed: boolean; violatedRule?: string; limit?: string } {
  for (const rule of policyRules) {
    if (rule.type === 'SolLimit' && decision.token.startsWith('So1')) {
      const limit = parseInt(rule.amount);
      if (decision.amount_lamports > limit) {
        return {
          allowed: false,
          violatedRule: `SolLimit (${(limit / 1e9).toFixed(1)} SOL max per trade)`,
          limit: rule.amount,
        };
      }
    }

    if (rule.type === 'SolRecurringLimit' && decision.token.startsWith('So1')) {
      const dailyLimit = parseInt(rule.recurringAmount);
      if (solUsedToday + decision.amount_lamports > dailyLimit) {
        return {
          allowed: false,
          violatedRule: `SolRecurringLimit (${(dailyLimit / 1e9).toFixed(1)} SOL/day, used ${(solUsedToday / 1e9).toFixed(1)})`,
          limit: rule.recurringAmount,
        };
      }
    }

    if (rule.type === 'TokenLimit' && 'mint' in rule && rule.mint === decision.token) {
      const limit = parseInt(rule.amount);
      if (decision.amount_lamports > limit) {
        return {
          allowed: false,
          violatedRule: `TokenLimit (${limit} max per trade)`,
          limit: rule.amount,
        };
      }
    }
  }

  return { allowed: true };
}
