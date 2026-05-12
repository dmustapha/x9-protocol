'use client';

import { useState } from 'react';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  background: 'var(--color-x9-surface-2)',
  border: '1px solid var(--color-x9-border)',
  borderRadius: 8,
  color: 'var(--color-x9-text)',
  fontSize: 14,
  fontFamily: 'inherit',
  outline: 'none',
  transition: 'border-color 150ms ease',
};

export default function StrategyInput({ onSubmit }: { onSubmit: (name: string, strategy: string) => Promise<void> }) {
  const [name, setName] = useState('');
  const [strategy, setStrategy] = useState('');
  const [loading, setLoading] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [stratFocused, setStratFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <label className="x9-card-label" style={{ display: 'block', marginBottom: 8 }}>Agent Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onFocus={() => setNameFocused(true)}
          onBlur={() => setNameFocused(false)}
          placeholder="My Trading Agent"
          style={{
            ...inputStyle,
            borderColor: nameFocused ? 'var(--color-x9-accent)' : 'var(--color-x9-border)',
          }}
        />
      </div>

      <div>
        <label className="x9-card-label" style={{ display: 'block', marginBottom: 8 }}>Trading Strategy</label>
        <textarea
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          onFocus={() => setStratFocused(true)}
          onBlur={() => setStratFocused(false)}
          placeholder="Trade SOL and USDC. Be conservative. Max $100 a day, stop if I'm down 15%."
          rows={4}
          style={{
            ...inputStyle,
            borderColor: stratFocused ? 'var(--color-x9-accent)' : 'var(--color-x9-border)',
            resize: 'none',
            lineHeight: 1.6,
          }}
        />
        <p style={{ fontSize: 12, color: 'var(--color-x9-text-dim)', marginTop: 8 }}>
          Claude converts this into enforceable Swig policy rules. You review before deploying.
        </p>
      </div>

      <button
        onClick={async () => {
          if (!name || !strategy) return;
          setLoading(true);
          await onSubmit(name, strategy);
          setLoading(false);
        }}
        disabled={!name || !strategy || loading}
        className="x9-btn-primary"
        style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', opacity: (!name || !strategy || loading) ? 0.5 : undefined }}
      >
        {loading ? 'Converting strategy...' : 'Generate Policy'}
      </button>
    </div>
  );
}
