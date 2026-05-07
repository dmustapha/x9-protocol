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
        }),
      });

      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setAgentId(data.agent.id);
      onDeployed(data.agent.id);
      setStatus('done');
    } catch (err) {
      setError(String(err));
      setStatus('error');
    }
  };

  if (status === 'done') {
    return (
      <div className="text-center space-y-4">
        <div className="text-4xl">✓</div>
        <h2 className="text-xl font-semibold text-[var(--accent)]">Agent Deployed</h2>
        <p className="text-zinc-400">Your agent is ready. Start it from the dashboard.</p>
        <button
          onClick={() => router.push(`/agent/${agentId}`)}
          className="px-8 py-3 bg-[var(--accent)] text-black font-semibold rounded-lg"
        >
          View Agent
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <p className="text-zinc-400">
        Deploying <strong>{agentName}</strong> with {rules.length} policy rules.
      </p>
      {error && <p className="text-red-400 text-sm">{error}</p>}
      <button
        onClick={deploy}
        disabled={status === 'deploying'}
        className="w-full py-3 bg-[var(--accent)] text-black font-semibold rounded-lg hover:brightness-110 disabled:opacity-50"
      >
        {status === 'deploying' ? 'Deploying...' : 'Deploy Agent'}
      </button>
    </div>
  );
}
