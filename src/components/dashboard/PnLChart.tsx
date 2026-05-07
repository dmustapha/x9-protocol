'use client';

import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import type { PnLData } from '@/types';

export default function PnLChart({ data }: { data: PnLData[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="font-semibold mb-4">P&L</h3>
      {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data}>
            <XAxis dataKey="timestamp" tick={false} stroke="#3f3f46" />
            <YAxis stroke="#3f3f46" tickFormatter={(v) => `${v >= 0 ? '+' : ''}${v.toFixed(2)}`} />
            <Tooltip
              contentStyle={{ background: '#18181b', border: '1px solid #3f3f46', borderRadius: 8 }}
              labelFormatter={(l) => new Date(l).toLocaleString()}
              formatter={(v: number) => [`${v >= 0 ? '+' : ''}${v.toFixed(4)} SOL`, 'P&L']}
            />
            <Line type="monotone" dataKey="cumulativePnl" stroke="#00ff88" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="h-48 flex items-center justify-center text-zinc-600">No trade data</div>
      )}
    </div>
  );
}
