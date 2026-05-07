import type { TradeResponse } from '@/types';
import { LAMPORTS_PER_SOL } from '@/types';

export default function TradeFeed({ trades }: { trades: TradeResponse[] }) {
  return (
    <div className="x9-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="x9-card-label" style={{ margin: 0 }}>Trade Feed</div>
        <span className="x9-badge x9-badge--green">
          <span className="x9-status-dot x9-animate-pulse-dot" style={{ width: 5, height: 5 }} />
          LIVE
        </span>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {trades.map((t) => {
          const isBuy = t.action === 'buy';
          const isSell = t.action === 'sell';
          const isBlocked = t.action === 'blocked';
          const amtSol = (parseInt(t.amountLamports) / LAMPORTS_PER_SOL).toFixed(3);

          return (
            <div key={t.id} className="x9-trade-row">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className="x9-mono"
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: isBuy ? 'var(--color-x9-accent)' : isSell ? 'var(--color-x9-danger)' : isBlocked ? 'var(--color-x9-danger)' : 'var(--color-x9-text-muted)',
                    minWidth: 52,
                  }}
                >
                  {t.action.toUpperCase()}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-x9-text-muted)' }}>
                  {t.action !== 'hold' ? `${amtSol} SOL` : '—'}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {t.policyRule && (
                  <span className="x9-badge x9-badge--red" style={{ fontSize: 9 }}>
                    BLOCKED
                  </span>
                )}
                <span className="x9-mono" style={{ fontSize: 11, color: 'var(--color-x9-text-dim)' }}>
                  {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
            </div>
          );
        })}
        {trades.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-x9-text-dim)', fontSize: 13 }}>
            No trades recorded yet
          </div>
        )}
      </div>
    </div>
  );
}
