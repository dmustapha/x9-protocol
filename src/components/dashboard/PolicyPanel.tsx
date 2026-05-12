import type { ActionConfig } from '@/types';
import { LAMPORTS_PER_SOL, TOKEN_PROGRAM_ID, JUPITER_PROGRAM_ID } from '@/types';
import { getTokenByMint } from '@/lib/token-registry';

const KNOWN_PROGRAMS: Record<string, string> = {
  [TOKEN_PROGRAM_ID]: 'Token Program',
  [JUPITER_PROGRAM_ID]: 'Jupiter (swap aggregator)',
};

function ruleIcon(rule: ActionConfig): string {
  if (rule.type.startsWith('Sol')) return '◎';
  if (rule.type.startsWith('Token')) return '⬡';
  if (rule.type === 'Program') return '⬣';
  return '·';
}

function ruleColor(rule: ActionConfig): string {
  if (rule.type.startsWith('Sol')) return 'var(--color-x9-accent)';
  if (rule.type.startsWith('Token')) return 'var(--color-x9-cyan)';
  if (rule.type === 'Program') return 'var(--color-x9-blue)';
  return 'var(--color-x9-text-muted)';
}

export default function PolicyPanel({ rules }: { rules: ActionConfig[] }) {
  return (
    <div style={{ background: 'var(--color-x9-surface)', border: '1px solid var(--color-x9-border)', borderRadius: 12, padding: 16 }}>
      <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-x9-text-muted)', marginBottom: 12 }}>
        Active Policy Rules
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {rules.map((rule, i) => {
          const color = ruleColor(rule);
          return (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              background: 'var(--color-x9-surface-2)', borderRadius: 8, padding: '8px 12px',
              border: '1px solid var(--color-x9-border)',
            }}>
              <span style={{ fontSize: 14, color, flexShrink: 0, lineHeight: 1 }}>{ruleIcon(rule)}</span>
              <span style={{ fontSize: 13, color: 'var(--color-x9-text)' }}>{formatRule(rule)}</span>
            </div>
          );
        })}
        {rules.length === 0 && <div style={{ fontSize: 13, color: 'var(--color-x9-text-dim)' }}>No policy configured</div>}
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
