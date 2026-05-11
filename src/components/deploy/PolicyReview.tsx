'use client';

import type { ActionConfig, TradeableToken } from '@/types';
import PolicyPanel from '@/components/dashboard/PolicyPanel';

export default function PolicyReview({
  strategy,
  rules,
  interpretation,
  tradeableTokens,
  onConfirm,
  onBack,
}: {
  strategy: string;
  rules: ActionConfig[];
  interpretation?: string;
  tradeableTokens?: TradeableToken[];
  onConfirm: () => void;
  onBack: () => void;
}) {
  return (
    <div className="space-y-6">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
        <div className="text-sm text-zinc-400 mb-2">Your strategy:</div>
        <div className="text-sm italic">"{strategy}"</div>
      </div>

      {interpretation && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400 mb-2">Claude's interpretation:</div>
          <div className="text-sm" style={{ color: 'var(--color-x9-text)', lineHeight: 1.6 }}>{interpretation}</div>
        </div>
      )}

      {tradeableTokens && tradeableTokens.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
          <div className="text-sm text-zinc-400 mb-2">Tokens:</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {tradeableTokens.map((t) => (
              <span
                key={t.mint}
                style={{
                  fontSize: 12,
                  padding: '2px 8px',
                  borderRadius: 6,
                  background: 'var(--color-x9-surface-2)',
                  border: '1px solid var(--color-x9-border)',
                  color: 'var(--color-x9-text)',
                  fontWeight: 600,
                }}
              >
                {t.symbol}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="text-sm text-zinc-400 mb-2">Generated policy rules:</div>
        <PolicyPanel rules={rules} />
      </div>

      <p className="text-xs text-zinc-500">
        These rules will be enforced at the transaction layer via Swig. Your agent cannot exceed them.
        You'll sign this policy with Phantom. That signature is the onchain commitment.
      </p>

      <div className="flex gap-4">
        <button onClick={onBack} className="flex-1 py-3 border border-zinc-700 rounded-lg hover:bg-zinc-900">
          Back
        </button>
        <button onClick={onConfirm} className="flex-1 py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:brightness-110">
          Approve and Sign
        </button>
      </div>
    </div>
  );
}
