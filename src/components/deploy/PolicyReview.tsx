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
  const blockStyle: React.CSSProperties = {
    background: 'var(--color-x9-surface-2)',
    border: '1px solid var(--color-x9-border)',
    borderRadius: 12,
    padding: 16,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={blockStyle}>
        <div className="x9-card-label" style={{ marginBottom: 8 }}>Your strategy</div>
        <div style={{ fontSize: 14, fontStyle: 'italic', color: 'var(--color-x9-text)', lineHeight: 1.6 }}>"{strategy}"</div>
      </div>

      {interpretation && (
        <div style={blockStyle}>
          <div className="x9-card-label" style={{ marginBottom: 8 }}>Claude's interpretation</div>
          <div style={{ fontSize: 14, color: 'var(--color-x9-text)', lineHeight: 1.6 }}>{interpretation}</div>
        </div>
      )}

      {tradeableTokens && tradeableTokens.length > 0 && (
        <div style={blockStyle}>
          <div className="x9-card-label" style={{ marginBottom: 10 }}>Tradeable tokens</div>
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
                  fontFamily: 'var(--font-mono)',
                }}
              >
                {t.symbol}
              </span>
            ))}
          </div>
        </div>
      )}

      <div>
        <div className="x9-card-label" style={{ marginBottom: 10 }}>Generated policy rules</div>
        <PolicyPanel rules={rules} />
      </div>

      <p style={{ fontSize: 12, color: 'var(--color-x9-text-dim)' }}>
        These rules are enforced on Solana — your agent cannot exceed them. Review carefully before deploying.
      </p>

      <div style={{ display: 'flex', gap: 12 }}>
        <button onClick={onBack} className="x9-btn-ghost" style={{ flex: 1, justifyContent: 'center' }}>
          Back
        </button>
        <button onClick={onConfirm} className="x9-btn-primary" style={{ flex: 1, justifyContent: 'center' }}>
          Confirm and Continue
        </button>
      </div>
    </div>
  );
}
