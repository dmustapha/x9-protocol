import type { TradeResponse } from '@/types';
import { getTokenByMint } from '@/lib/token-registry';

function formatTradeAmount(token: string, amountLamports: string): string {
  const raw = parseInt(amountLamports);
  if (!raw || raw <= 0) return '—';
  const entry = getTokenByMint(token);
  const decimals = entry?.decimals ?? 9;
  const symbol = entry?.symbol ?? token.slice(0, 6);
  const amount = raw / Math.pow(10, decimals);
  return `${amount.toFixed(decimals <= 6 ? 2 : 4)} ${symbol}`;
}

export default function TradeFeed({ trades }: { trades: TradeResponse[] }) {
  return (
    <div className="x9-card" style={{ height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div className="x9-card-label" style={{ margin: 0 }}>Trade Feed</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--color-x9-text-dim)' }}>1 decision per 5-min cycle</span>
          <span className="x9-badge x9-badge--green">
            <span className="x9-status-dot x9-animate-pulse-dot" style={{ width: 5, height: 5 }} />
            LIVE
          </span>
        </div>
      </div>
      <div style={{ maxHeight: 320, overflowY: 'auto' }}>
        {trades.map((t, idx) => {
          const isBuy = t.action === 'buy';
          const isSell = t.action === 'sell';
          const isBlocked = t.action === 'blocked';
          const isLast = idx === trades.length - 1;
          const amountDisplay = t.action !== 'hold' ? formatTradeAmount(t.token, t.amountLamports) : '—';
          const actionColor = isBuy
            ? 'var(--color-x9-accent)'
            : isSell || isBlocked
            ? 'var(--color-x9-danger)'
            : 'var(--color-x9-text-muted)';

          return (
            <div
              key={t.id}
              style={{ borderBottom: isLast ? 'none' : '1px solid var(--color-x9-border)' }}
            >
              <div
                className="x9-trade-row"
                style={{ borderBottom: 'none' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="x9-mono"
                    style={{ fontSize: 12, fontWeight: 700, color: actionColor, minWidth: 52 }}
                  >
                    {t.action.toUpperCase()}
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--color-x9-text-muted)' }}>
                    {amountDisplay}
                  </span>
                </div>
                <span className="x9-mono" style={{ fontSize: 11, color: 'var(--color-x9-text-dim)' }}>
                  {new Date(t.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </div>
              {t.reason && t.action !== 'hold' && (
                <div style={{ fontSize: 11, color: 'var(--color-x9-text-dim)', paddingBottom: 8, lineHeight: 1.4 }}>
                  {t.reason.slice(0, 140)}{t.reason.length > 140 ? '…' : ''}
                </div>
              )}
            </div>
          );
        })}
        {trades.length === 0 && (
          <div style={{ textAlign: 'center', padding: '24px 0', color: 'var(--color-x9-text-dim)', fontSize: 13 }}>
            No trades yet — start an agent and wait for the next 5-minute cycle.
          </div>
        )}
      </div>
    </div>
  );
}
