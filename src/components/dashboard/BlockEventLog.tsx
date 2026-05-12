import type { BlockEventResponse } from '@/types';
import { LAMPORTS_PER_SOL } from '@/types';

const RULE_LABELS: Record<string, string> = {
  SolLimit:            'Per-trade SOL limit exceeded',
  SolRecurringLimit:   'Daily SOL limit exceeded',
  TokenLimit:          'Per-trade token limit exceeded',
  TokenRecurringLimit: 'Daily token limit exceeded',
  Program:             'Unauthorized program blocked',
};

function humanizeRule(raw: string): string {
  return RULE_LABELS[raw] ?? raw;
}

export default function BlockEventLog({ events }: { events: BlockEventResponse[] }) {
  return (
    <div className="x9-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="x9-card-label" style={{ margin: 0 }}>Block Events</div>
        <span className={`x9-badge ${events.length > 0 ? 'x9-badge--red' : 'x9-badge--muted'}`}>
          {events.length} {events.length === 1 ? 'block' : 'blocks'}
        </span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 480, overflowY: 'auto' }}>
        {events.map((e) => {
          const amtSol = (parseInt(e.attemptedAmount) / LAMPORTS_PER_SOL).toFixed(3);
          return (
            <div
              key={e.id}
              style={{
                background: 'rgba(239,68,68,0.05)',
                border: '1px solid rgba(239,68,68,0.15)',
                borderRadius: 'var(--radius-md)',
                padding: '10px 12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                <span className="x9-mono" style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-x9-danger)' }}>
                  BLOCKED · {amtSol} SOL
                </span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-x9-text-muted)', marginBottom: 3 }}>
                {humanizeRule(e.ruleTriggered)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--color-x9-text-muted)' }}>
                {e.claudeReasoning}
              </div>
              <div className="x9-mono" style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginTop: 4 }}>
                {new Date(e.createdAt).toLocaleString()}
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-x9-text-dim)', fontSize: 13 }}>
            No blocks today — policy is holding.
          </div>
        )}
      </div>
    </div>
  );
}
