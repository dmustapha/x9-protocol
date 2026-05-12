'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { PnLData } from '@/types';

export default function PnLChart({ data }: { data: PnLData[] }) {
  return (
    <div className="x9-card">
      <div className="x9-card-label">P&amp;L</div>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="timestamp" tick={false} stroke="var(--color-x9-border-strong)" />
            <YAxis stroke="var(--color-x9-border-strong)" tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`} tick={{ fontSize: 11, fill: 'var(--color-x9-text-dim)' }} />
            <Tooltip
              contentStyle={{ background: 'var(--color-x9-surface-2)', border: '1px solid var(--color-x9-border-strong)', borderRadius: 8 }}
              labelFormatter={(l) => new Date(l).toLocaleString()}
              formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(4)} SOL`, 'P&L']}
            />
            <Line type="monotone" dataKey="cumulativePnl" stroke="var(--color-x9-accent)" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ height: 192, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-x9-text-dim)', fontSize: 13 }}>No trade data</div>
      )}
    </div>
  );
}
