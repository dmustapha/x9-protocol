'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TradeFeed from '@/components/dashboard/TradeFeed';
import PolicyPanel from '@/components/dashboard/PolicyPanel';
import PnLChart from '@/components/dashboard/PnLChart';
import PrivacyScore from '@/components/dashboard/PrivacyScore';
import DunePanel from '@/components/dashboard/DunePanel';
import StatusBadge from '@/components/shared/StatusBadge';
import type { AgentResponse, TradeResponse, PnLData, ActionConfig } from '@/types';

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [agent, setAgent] = useState<AgentResponse & { policyRules: ActionConfig[] } | null>(null);
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [pnl, setPnl] = useState<PnLData[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/agent/${id}`).then(r => r.json()).then(setAgent);
    fetch(`/api/agent/${id}/trades`).then(r => r.json()).then(setTrades);
    fetch(`/api/agent/${id}/pnl`).then(r => r.json()).then(d => setPnl(d.pnlData));
  }, [id]);

  if (!agent) return <div className="text-center py-20 text-zinc-500">Loading agent...</div>;

  const handleToggle = async () => {
    const action = agent.status === 'active' ? 'stop' : 'start';
    await fetch(`/api/agent/${id}/${action}`, { method: 'POST' });
    const updated = await fetch(`/api/agent/${id}`).then(r => r.json());
    setAgent(updated);
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <StatusBadge status={agent.status as 'active' | 'paused' | 'blocked' | 'stopped'} />
        </div>
        <button
          onClick={handleToggle}
          className={`px-6 py-2 rounded-lg font-semibold ${
            agent.status === 'active'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-[var(--accent)] text-black hover:brightness-110'
          }`}
        >
          {agent.status === 'active' ? 'Stop Agent' : 'Start Agent'}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <InfoCard label="Swig Wallet" value={agent.swigWalletAddress || 'N/A'} />
        <InfoCard label="Metaplex NFT" value={agent.metaplexNftAddress || 'N/A'} link={agent.metaplexNftAddress ? `https://core.metaplex.com/explorer/${agent.metaplexNftAddress}?env=devnet` : undefined} />
        <InfoCard label="SNS Identity" value={(agent as AgentResponse & { snsDomain?: string | null }).snsDomain || deriveSNSDomain(agent.name)} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PnLChart data={pnl} />
          <TradeFeed trades={trades} />
        </div>
        <div className="space-y-6">
          <PolicyPanel rules={agent.policyRules} />
          {trades[0]?.privacyScore && <PrivacyScore score={trades[0].privacyScore} />}
          <DunePanel agentId={id} />
        </div>
      </div>
    </div>
  );
}

function deriveSNSDomain(name: string): string {
  const sanitized = name.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 32) || 'agent';
  return `${sanitized}.sol`;
}

function InfoCard({ label, value, link }: { label: string; value: string; link?: string }) {
  const display = value.length > 20 ? value.slice(0, 8) + '...' + value.slice(-6) : value;
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="text-xs text-zinc-500 mb-1">{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline text-sm">{display}</a>
      ) : (
        <div className="text-sm font-mono">{display}</div>
      )}
    </div>
  );
}
