import type { ActionConfig } from '@/types';
import { LAMPORTS_PER_SOL, TOKEN_PROGRAM_ID, JUPITER_PROGRAM_ID } from '@/types';
import { getTokenByMint } from '@/lib/token-registry';

const KNOWN_PROGRAMS: Record<string, string> = {
  [TOKEN_PROGRAM_ID]: 'Token Program',
  [JUPITER_PROGRAM_ID]: 'Jupiter (swap aggregator)',
};

export default function PolicyPanel({ rules }: { rules: ActionConfig[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="font-semibold mb-4">Active Policy Rules</h3>
      <div className="space-y-2">
        {rules.map((rule, i) => (
          <div key={i} className="text-sm p-2 bg-zinc-800/50 rounded">
            {formatRule(rule)}
          </div>
        ))}
        {rules.length === 0 && <div className="text-zinc-600 text-sm">No policy configured</div>}
      </div>
    </div>
  );
}

function formatRule(rule: ActionConfig): string {
  switch (rule.type) {
    case 'SolLimit':
      return `Max ${(parseInt(rule.amount) / LAMPORTS_PER_SOL).toFixed(2)} SOL per trade`;
    case 'SolRecurringLimit':
      return `Max ${(parseInt(rule.recurringAmount) / LAMPORTS_PER_SOL).toFixed(2)} SOL per day`;
    case 'TokenLimit': {
      const token = getTokenByMint(rule.mint);
      const symbol = token?.symbol ?? `${rule.mint.slice(0, 6)}...`;
      const amount = token
        ? (parseInt(rule.amount) / Math.pow(10, token.decimals)).toFixed(2)
        : rule.amount;
      return `Max ${amount} ${symbol} per trade`;
    }
    case 'TokenRecurringLimit': {
      const token = getTokenByMint(rule.mint);
      const symbol = token?.symbol ?? `${rule.mint.slice(0, 6)}...`;
      const amount = token
        ? (parseInt(rule.recurringAmount) / Math.pow(10, token.decimals)).toFixed(2)
        : rule.recurringAmount;
      return `Max ${amount} ${symbol} per day`;
    }
    case 'Program': {
      const name = KNOWN_PROGRAMS[rule.programId] ?? `${rule.programId.slice(0, 8)}...`;
      return `Allowed program: ${name}`;
    }
    default:
      return `${rule.type}`;
  }
}
