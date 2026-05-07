import type { ActionConfig } from '@/types';
import { LAMPORTS_PER_SOL } from '@/types';

export default function PolicyPanel({ rules }: { rules: ActionConfig[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="font-semibold mb-4">Policy Rules</h3>
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
    case 'SolLimit': return `Max ${(parseInt(rule.amount) / LAMPORTS_PER_SOL).toFixed(1)} SOL per trade`;
    case 'SolRecurringLimit': return `Max ${(parseInt(rule.recurringAmount) / LAMPORTS_PER_SOL).toFixed(1)} SOL per day`;
    case 'TokenLimit': return `Max ${rule.amount} tokens per trade (${rule.mint.slice(0,6)}...)`;
    case 'TokenRecurringLimit': return `Max ${rule.recurringAmount} tokens/day (${rule.mint.slice(0,6)}...)`;
    case 'Program': return `Whitelisted: ${rule.programId.slice(0,8)}...`;
    default: return `${rule.type}`;
  }
}
