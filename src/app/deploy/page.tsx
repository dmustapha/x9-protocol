'use client';

import { useState } from 'react';
import StrategyInput from '@/components/deploy/StrategyInput';
import PolicyReview from '@/components/deploy/PolicyReview';
import DeployConfirm from '@/components/deploy/DeployConfirm';
import type { ActionConfig, TradeableToken } from '@/types';

type Step = 'strategy' | 'understanding' | 'review' | 'deploy';

const STEPS: { key: Step; label: string; num: number }[] = [
  { key: 'strategy',     label: 'Define Strategy',    num: 1 },
  { key: 'understanding', label: "Claude's Understanding", num: 2 },
  { key: 'review',       label: 'Review Policy',      num: 3 },
  { key: 'deploy',       label: 'Deploy Agent',        num: 4 },
];

export default function DeployPage() {
  const [step, setStep] = useState<Step>('strategy');
  const [strategy, setStrategy] = useState('');
  const [agentName, setAgentName] = useState('');
  const [policyRules, setPolicyRules] = useState<ActionConfig[]>([]);
  const [tradeableTokens, setTradeableTokens] = useState<TradeableToken[]>([]);
  const [interpretation, setInterpretation] = useState('');
  const [agentId, setAgentId] = useState<string | null>(null);

  const currentIdx = STEPS.findIndex((s) => s.key === step);

  return (
    <div className="x9-main-container" style={{ maxWidth: 680, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="x9-badge x9-badge--green">Step {currentIdx + 1} of 4</span>
        </div>
        <h1 className="x9-mono" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Deploy Agent
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-x9-text-muted)', marginTop: 6 }}>
          Define a strategy → AI generates policy rules → deploy onchain with Swig enforcement.
        </p>
      </div>

      {/* Progress steps */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isDone = i < currentIdx;
          return (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
                <div
                  className="x9-mono"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                    background: isDone ? 'var(--color-x9-accent)' : isActive ? 'var(--color-x9-accent-dim)' : 'var(--color-x9-surface-2)',
                    color: isDone ? '#09090b' : isActive ? 'var(--color-x9-accent)' : 'var(--color-x9-text-muted)',
                    border: isActive ? '1px solid var(--color-x9-accent)' : '1px solid var(--color-x9-border)',
                    flexShrink: 0,
                  }}
                >
                  {isDone ? '✓' : s.num}
                </div>
                <span style={{ fontSize: 12, color: isActive ? 'var(--color-x9-text)' : 'var(--color-x9-text-muted)', fontWeight: isActive ? 500 : 400 }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: isDone ? 'var(--color-x9-accent)' : 'var(--color-x9-border)', marginLeft: 8 }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step panels */}
      {step === 'strategy' && (
        <StrategyInput
          onSubmit={async (name, text) => {
            setAgentName(name);
            setStrategy(text);
            const res = await fetch('/api/policy/create', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ strategyText: text }),
            });
            if (!res.ok) throw new Error('Policy generation failed. Please try again.');
            const data = await res.json();
            if (!Array.isArray(data.rules)) throw new Error('Invalid policy response from server.');
            setPolicyRules(data.rules);
            setTradeableTokens(data.tradeableTokens ?? []);
            setInterpretation(data.interpretation ?? '');
            setStep('understanding');
          }}
        />
      )}

      {step === 'understanding' && (
        <UnderstandingStep
          interpretation={interpretation}
          tradeableTokens={tradeableTokens}
          rules={policyRules}
          onConfirm={() => setStep('review')}
          onRevise={() => setStep('strategy')}
        />
      )}

      {step === 'review' && (
        <PolicyReview
          strategy={strategy}
          rules={policyRules}
          interpretation={interpretation}
          tradeableTokens={tradeableTokens}
          onConfirm={() => setStep('deploy')}
          onBack={() => setStep('understanding')}
        />
      )}

      {step === 'deploy' && (
        <DeployConfirm
          agentName={agentName}
          strategy={strategy}
          rules={policyRules}
          onDeployed={(id) => setAgentId(id)}
        />
      )}

      {!agentId && (
        <div style={{ fontSize: 11, color: 'var(--color-x9-text-dim)', borderTop: '1px solid var(--color-x9-border)', paddingTop: 12 }}>
          Policy rules enforced by Swig Smart Wallet · Agent NFT minted via Metaplex Core · Trades routed through Jupiter
        </div>
      )}
    </div>
  );
}

function UnderstandingStep({
  interpretation,
  tradeableTokens,
  rules,
  onConfirm,
  onRevise,
}: {
  interpretation: string;
  tradeableTokens: TradeableToken[];
  rules: ActionConfig[];
  onConfirm: () => void;
  onRevise: () => void;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="x9-card">
        <div className="x9-card-label" style={{ marginBottom: 10 }}>Claude's Understanding</div>
        <p style={{ fontSize: 14, color: 'var(--color-x9-text)', lineHeight: 1.6, margin: 0 }}>
          {interpretation || 'Strategy interpreted — reviewing policy rules.'}
        </p>
      </div>

      {tradeableTokens.length > 0 && (
        <div className="x9-card">
          <div className="x9-card-label" style={{ marginBottom: 10 }}>Tokens Claude will trade</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {tradeableTokens.map((t) => (
              <div
                key={t.mint}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--color-x9-surface-2)',
                  border: '1px solid var(--color-x9-border)',
                  borderRadius: 8,
                  padding: '4px 10px',
                  fontSize: 13,
                }}
              >
                <span style={{ fontWeight: 600, color: 'var(--color-x9-accent)' }}>{t.symbol}</span>
                <span
                  style={{
                    fontSize: 10,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: t.tier === 'blue_chip' ? 'rgba(34,197,94,0.15)' : t.tier === 'degen' ? 'rgba(239,68,68,0.15)' : 'rgba(234,179,8,0.15)',
                    color: t.tier === 'blue_chip' ? '#22c55e' : t.tier === 'degen' ? '#ef4444' : '#eab308',
                  }}
                >
                  {t.tier === 'blue_chip' ? 'verified' : t.tier}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="x9-card" style={{ fontSize: 12, color: 'var(--color-x9-text-muted)' }}>
        <span style={{ fontWeight: 600, color: 'var(--color-x9-text)', marginRight: 6 }}>{rules.length} rules generated.</span>
        These will be enforced at the transaction layer — your agent cannot exceed them.
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={onRevise}
          style={{ flex: 1, padding: '12px 0', border: '1px solid var(--color-x9-border)', borderRadius: 10, background: 'none', color: 'var(--color-x9-text)', cursor: 'pointer', fontSize: 14 }}
        >
          Let me revise
        </button>
        <button
          onClick={onConfirm}
          className="x9-btn-primary"
          style={{ flex: 2 }}
        >
          That's right, show me the rules
        </button>
      </div>
    </div>
  );
}
