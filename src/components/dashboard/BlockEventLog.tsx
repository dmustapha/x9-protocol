import type { BlockEventResponse } from '@/types';
import { LAMPORTS_PER_SOL } from '@/types';

export default function BlockEventLog({ events }: { events: BlockEventResponse[] }) {
  return (
    <div className="x9-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="x9-card-label" style={{ margin: 0 }}>Block Events</div>
        <span className="x9-badge x9-badge--red">{events.length} total</span>
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
              <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 3 }}>
                Rule: {e.ruleTriggered}
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-x9-text-dim)' }}>
                {e.claudeReasoning}
              </div>
              <div className="x9-mono" style={{ fontSize: 10, color: 'var(--color-x9-text-dim)', marginTop: 4 }}>
                {new Date(e.createdAt).toLocaleString()}
              </div>
            </div>
          );
        })}
        {events.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-x9-text-dim)', fontSize: 13 }}>
            No blocks today
          </div>
        )}
      </div>
    </div>
  );
}
