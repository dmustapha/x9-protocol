'use client';

import { useEffect, useState } from 'react';

interface DuneResult {
  queryId: string;
  rows: Record<string, unknown>[];
  source: 'dune' | 'derived' | 'cache';
}

interface DuneAnalytics {
  tradeVolume: DuneResult;
  buySellRatio: DuneResult;
  pnlCurve: DuneResult;
  txHistory: DuneResult;
}

interface Props {
  agentId: string;
}

export default function DunePanel({ agentId }: Props) {
  const [analytics, setAnalytics] = useState<DuneAnalytics | null>(null);

  useEffect(() => {
    if (!agentId) return;
    fetch(`/api/dune/${agentId}`)
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(() => null);
  }, [agentId]);

  if (!analytics) {
    return (
      <div className="x9-card">
        <div className="x9-card-label">Analytics</div>
        <div style={{ color: 'var(--color-x9-text-dim)', fontSize: 12 }}>Loading analytics...</div>
      </div>
    );
  }

  const sourceLabel = analytics.tradeVolume.source === 'dune'
    ? 'Dune · LIVE'
    : analytics.tradeVolume.source === 'cache'
    ? 'Dune · Cached'
    : 'Derived · Local';

  const bsr = analytics.buySellRatio.rows[0] as { buys?: number; sells?: number; holds?: number; ratio?: string } | undefined;
  const totalVolume = analytics.tradeVolume.rows.reduce((sum, r) => sum + Number((r as { volume_lamports?: number }).volume_lamports ?? 0), 0);
  const volumeSol = (totalVolume / 1e9).toFixed(4);
  const txCount = analytics.txHistory.rows.length;

  return (
    <div className="x9-card" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div className="x9-card-label">Dune Analytics</div>
        <span className={`x9-badge ${analytics.tradeVolume.source === 'dune' ? 'x9-badge--green' : 'x9-badge--yellow'}`}>
          {sourceLabel}
        </span>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <StatBox label="Total Volume" value={`${volumeSol} SOL`} />
        <StatBox label="Transactions" value={String(txCount)} />
        <StatBox label="Buys / Sells" value={`${bsr?.buys ?? 0} / ${bsr?.sells ?? 0}`} />
        <StatBox label="B/S Ratio" value={bsr?.ratio ?? 'N/A'} />
      </div>

      {/* PnL curve mini-table */}
      {analytics.pnlCurve.rows.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 6 }}>Cumulative P&L</div>
          <div style={{ maxHeight: 120, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
            {analytics.pnlCurve.rows.slice(-5).map((r, i) => {
              const row = r as { timestamp?: string; pnl_sol?: string };
              const pnlVal = parseFloat(row.pnl_sol ?? '0');
              return (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 0', borderBottom: '1px solid var(--color-x9-border)' }}>
                  <span style={{ color: 'var(--color-x9-text-dim)' }}>
                    {row.timestamp ? new Date(row.timestamp).toLocaleTimeString() : '—'}
                  </span>
                  <span style={{ color: pnlVal >= 0 ? 'var(--color-x9-accent)' : 'var(--color-x9-danger)' }}>
                    {pnlVal >= 0 ? '+' : ''}{row.pnl_sol} SOL
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'var(--color-x9-surface-raised)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: 'var(--color-x9-text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div className="x9-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-x9-text)' }}>{value}</div>
    </div>
  );
}
