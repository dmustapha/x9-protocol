'use client';

import { useState } from 'react';
import { useAccounts } from '@phantom/react-sdk';
import type { ActionConfig } from '@/types';
import { useRouter } from 'next/navigation';

export default function DeployConfirm({
  agentName,
  strategy,
  rules,
  onDeployed,
}: {
  agentName: string;
  strategy: string;
  rules: ActionConfig[];
  onDeployed: (id: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'deploying' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [agentId, setAgentId] = useState('');
  const [agentPublicKey, setAgentPublicKey] = useState('');
  const accounts = useAccounts();
  const router = useRouter();
  const walletAddress = accounts?.find((a) => a.addressType === 'Solana')?.address;

  const deploy = async () => {
    if (!walletAddress) {
      setError('Connect your Phantom wallet first');
      return;
    }

    setStatus('deploying');
    try {
      const res = await fetch('/api/agent/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ownerWallet: walletAddress,
          name: agentName,
          strategyText: strategy,
          policyRules: rules,
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAgentId(data.agent.id);
      setAgentPublicKey(data.agent.agentPublicKey ?? '');
      onDeployed(data.agent.id);
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="x9-card" style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="x9-mono" style={{ fontSize: 32, color: 'var(--color-x9-accent)' }}>✓</div>
        <div style={{ fontWeight: 600, fontSize: 16, color: 'var(--color-x9-accent)' }}>Agent Deployed</div>
        <p style={{ fontSize: 13, color: 'var(--color-x9-text-muted)', margin: 0 }}>
          Your agent is ready. Fund it with at least 0.01 SOL to start trading.
        </p>
        {agentPublicKey && (
          <div style={{ background: 'var(--color-x9-surface-2)', border: '1px solid var(--color-x9-border)', borderRadius: 8, padding: '10px 14px', textAlign: 'left' }}>
            <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>Send SOL to agent wallet:</div>
            <div className="x9-mono" style={{ fontSize: 12, wordBreak: 'break-all', color: 'var(--color-x9-accent)' }}>{agentPublicKey}</div>
          </div>
        )}
        <button
          onClick={() => router.push(`/agent/${agentId}`)}
          className="x9-btn-primary"
        >
          View Agent
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'center' }}>
      <p style={{ fontSize: 13, color: 'var(--color-x9-text-muted)', margin: 0 }}>
        Deploying <strong>{agentName}</strong> with {rules.length} policy rules.
      </p>
      {error && (
        <p style={{ fontSize: 12, color: '#ef4444', margin: 0 }}>{error}</p>
      )}
      <button
        onClick={deploy}
        disabled={status === 'deploying'}
        className="x9-btn-primary"
        style={{ width: '100%', opacity: status === 'deploying' ? 0.5 : 1 }}
      >
        {status === 'deploying' ? 'Deploying...' : 'Deploy Agent'}
      </button>
    </div>
  );
}
