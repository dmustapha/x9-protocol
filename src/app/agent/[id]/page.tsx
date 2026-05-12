'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useAccounts } from '@phantom/react-sdk';
import TradeFeed from '@/components/dashboard/TradeFeed';
import PolicyPanel from '@/components/dashboard/PolicyPanel';
import PnLChart from '@/components/dashboard/PnLChart';
import PrivacyScore from '@/components/dashboard/PrivacyScore';
import DunePanel from '@/components/dashboard/DunePanel';
import StatusBadge from '@/components/shared/StatusBadge';
import type { AgentResponse, TradeResponse, PnLData, ActionConfig, AgentStatus } from '@/types';

interface WalletData {
  agentPublicKey: string;
  vanishDepositAddr: string | null;
  sol: number;
  usdc: number;
  totalUsdValue: number;
  shieldedSol: number;
  source: 'goldrush' | 'mock';
}

export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const accounts = useAccounts();
  const walletAddress = accounts?.find((a) => a.addressType === 'Solana')?.address ?? '';
  const [agent, setAgent] = useState<AgentResponse & { policyRules: ActionConfig[] } | null>(null);
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [pnl, setPnl] = useState<PnLData[]>([]);
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [toggling, setToggling] = useState(false);
  const [toggleMsg, setToggleMsg] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [keyExport, setKeyExport] = useState<{ byteArray: number[]; hex: string } | null>(null);
  const [showKey, setShowKey] = useState(false);

  const fetchTrades = () => {
    fetch(`/api/agent/${id}/trades`).then(r => r.json()).then(setTrades);
    fetch(`/api/agent/${id}/pnl`).then(r => r.json()).then(d => setPnl(d.pnlData));
  };

  useEffect(() => {
    if (!id) return;
    fetch(`/api/agent/${id}`).then(r => r.json()).then(setAgent);
    fetch(`/api/agent/${id}/wallet`).then(r => r.json()).then(d => {
      if (!d.error) setWallet(d);
    });
    fetchTrades();
  }, [id]);

  // Poll trades + PnL every 15s so the feed updates as the cron fires
  useEffect(() => {
    if (!id) return;
    const interval = setInterval(fetchTrades, 15_000);
    return () => clearInterval(interval);
  }, [id]);

  if (!agent || 'error' in agent || !agent.name) return <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--color-x9-text-dim)' }}>Loading agent...</div>;

  const handleToggle = async () => {
    const action = agent.status === 'active' ? 'stop' : 'start';
    setToggling(true);
    setToggleMsg('');
    const url = walletAddress
      ? `/api/agent/${id}/${action}?wallet=${walletAddress}`
      : `/api/agent/${id}/${action}`;
    try {
      await fetch(url, { method: 'POST' });
      const updated = await fetch(`/api/agent/${id}`).then(r => r.json());
      setAgent(updated);
      setToggleMsg(action === 'start' ? 'Agent started — first trade in ~5 min' : 'Agent stopped');
    } finally {
      setToggling(false);
    }
  };

  const handleWithdraw = async () => {
    setWithdrawing(true);
    setWithdrawMsg('');
    try {
      const res = await fetch(`/api/agent/${id}/withdraw`, { method: 'POST' });
      const data = await res.json();
      if (data.error) {
        setWithdrawMsg(`Error: ${data.error}`);
      } else {
        setWithdrawMsg(`Withdrawn ${data.amount.toFixed(4)} SOL → wallet`);
        // Refresh wallet balance
        fetch(`/api/agent/${id}/wallet`).then(r => r.json()).then(d => { if (!d.error) setWallet(d); });
      }
    } finally {
      setWithdrawing(false);
    }
  };

  const handleExportKey = async () => {
    const res = await fetch(`/api/agent/${id}/export-key`);
    const data = await res.json();
    if (!data.error) setKeyExport(data);
    setShowKey(true);
  };

  const metaplexAddr = agent.metaplexNftAddress;
  const metaplexLink = metaplexAddr && metaplexAddr !== 'registration-pending'
    ? `https://core.metaplex.com/explorer/${metaplexAddr}?env=devnet`
    : undefined;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{agent.name}</h1>
          <StatusBadge status={agent.status as AgentStatus} />
        </div>
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleToggle}
            disabled={toggling}
            className={`px-6 py-2 rounded-lg font-semibold disabled:opacity-50 ${
              agent.status === 'active'
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-[var(--accent)] text-black hover:brightness-110'
            }`}
          >
            {toggling ? (agent.status === 'active' ? 'Stopping…' : 'Starting…') : (agent.status === 'active' ? 'Stop Agent' : 'Start Agent')}
          </button>
          {toggleMsg && <span style={{ fontSize: 12, color: 'var(--color-x9-text-muted)' }}>{toggleMsg}</span>}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <InfoCard label="Swig Wallet" value={agent.swigWalletAddress || 'N/A'} />
        <InfoCard
          label="Metaplex NFT"
          value={metaplexAddr || 'N/A'}
          link={metaplexLink}
        />
        <InfoCard label="SNS Identity" value={(agent as AgentResponse & { snsDomain?: string | null }).snsDomain || deriveSNSDomain(agent.name)} />
      </div>

      {/* Agent Wallet Card */}
      {wallet && (
        <div className="x9-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div className="x9-card-label" style={{ marginBottom: 0 }}>Agent Wallet</div>
            <span className={`x9-badge ${wallet.source === 'goldrush' ? 'x9-badge--green' : 'x9-badge--muted'}`}>
              {wallet.source === 'goldrush' ? 'GoldRush · LIVE' : 'Mock'}
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
            <WalletStat label="SOL" value={wallet.sol.toFixed(4)} />
            <WalletStat label="USDC" value={`$${wallet.usdc.toFixed(2)}`} />
            <WalletStat label="Total Value" value={`$${wallet.totalUsdValue.toFixed(2)}`} />
            <WalletStat label="Shielded SOL" value={wallet.shieldedSol.toFixed(4)} accent />
          </div>
          <AddressField label="Agent public key — send SOL here to fund trading" value={wallet.agentPublicKey} accent />
          {wallet.vanishDepositAddr && wallet.vanishDepositAddr !== 'vanish-pending' && (
            <AddressField label="Vanish deposit address (auto-funded by agent)" value={wallet.vanishDepositAddr} style={{ marginTop: 12 }} />
          )}
        </div>
      )}

      {/* Withdraw + Key Export */}
      {wallet && (
        <div className="x9-card" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="x9-card-label" style={{ marginBottom: 0 }}>Fund Recovery</div>

          {/* Withdraw button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <button
              onClick={handleWithdraw}
              disabled={withdrawing || (wallet?.sol ?? 0) <= 0}
              style={{
                padding: '8px 20px',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: 13,
                cursor: withdrawing || (wallet?.sol ?? 0) <= 0 ? 'not-allowed' : 'pointer',
                opacity: withdrawing || (wallet?.sol ?? 0) <= 0 ? 0.5 : 1,
                background: 'var(--color-x9-accent)',
                color: '#000',
                border: 'none',
              }}
            >
              {withdrawing ? 'Withdrawing…' : 'Withdraw All SOL → My Wallet'}
            </button>
            {withdrawMsg && (
              <span style={{ fontSize: 12, color: withdrawMsg.startsWith('Error') ? 'var(--color-x9-danger)' : 'var(--color-x9-accent)' }}>
                {withdrawMsg}
              </span>
            )}
          </div>
          <p style={{ fontSize: 12, color: 'var(--color-x9-text-muted)', margin: 0 }}>
            Transfers all SOL from the agent wallet back to the address that deployed it.
          </p>

          {/* Key export — collapsed by default */}
          <details style={{ marginTop: 4 }}>
            <summary style={{ fontSize: 12, color: 'var(--color-x9-text-muted)', cursor: 'pointer', userSelect: 'none', fontWeight: 600 }}>
              Advanced — Export Agent Private Key
            </summary>
            <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <p style={{ fontSize: 12, color: 'var(--color-x9-text-muted)', margin: 0 }}>
                Import into Phantom → Settings → Import Private Key → Byte Array. Paste the JSON array below.
              </p>
              {!showKey ? (
                <button
                  onClick={handleExportKey}
                  style={{ alignSelf: 'flex-start', padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: 'transparent', border: '1px solid var(--color-x9-border)', color: 'var(--color-x9-text-muted)', cursor: 'pointer' }}
                >
                  Reveal Key
                </button>
              ) : keyExport ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Byte Array (Phantom)</div>
                  <KeyBox value={JSON.stringify(keyExport.byteArray)} />
                  <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>Hex (CLI)</div>
                  <KeyBox value={keyExport.hex} />
                  <p style={{ fontSize: 11, color: 'var(--color-x9-danger)', margin: 0 }}>
                    ⚠ Anyone with this key controls the wallet. Do not share it.
                  </p>
                </div>
              ) : (
                <span style={{ fontSize: 12, color: 'var(--color-x9-danger)' }}>Failed to load key</span>
              )}
            </div>
          </details>
        </div>
      )}

      {/* One-trade-per-cycle note */}
      <div style={{ fontSize: 12, color: 'var(--color-x9-text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-x9-accent)', display: 'inline-block' }} />
        1 decision per 5-minute cycle
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <PnLChart data={pnl} />
          <TradeFeed trades={trades} />
        </div>
        <div className="space-y-6">
          <PolicyPanel rules={agent.policyRules ?? []} />
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
    <div className="x9-card">
      <div style={{ fontSize: 11, color: 'var(--color-x9-text-dim)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em', fontWeight: 600 }}>{label}</div>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-x9-accent)', fontSize: 13, fontFamily: 'var(--font-mono)', textDecoration: 'none' }}
           onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
           onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}>{display}</a>
      ) : (
        <div className="x9-mono" style={{ fontSize: 13 }}>{display}</div>
      )}
    </div>
  );
}

function WalletStat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 2 }}>{label}</div>
      <div className="x9-mono" style={{ fontSize: 16, fontWeight: 700, color: accent ? 'var(--color-x9-accent)' : 'var(--color-x9-text)' }}>
        {value}
      </div>
    </div>
  );
}

function KeyBox({ value }: { value: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--color-x9-surface)', border: '1px solid var(--color-x9-border)', borderRadius: 6, padding: '8px 12px' }}>
      <div className="x9-mono" style={{ fontSize: 11, color: 'var(--color-x9-text)', wordBreak: 'break-all', flex: 1, maxHeight: 80, overflowY: 'auto' }}>{value}</div>
      <button onClick={() => { navigator.clipboard.writeText(value); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
        style={{ flexShrink: 0, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontFamily: 'var(--font-mono)', color: copied ? 'var(--color-x9-accent)' : 'var(--color-x9-text-dim)', padding: '2px 6px' }}>
        {copied ? 'copied' : 'copy'}
      </button>
    </div>
  );
}

function AddressField({ label, value, accent, style }: { label: string; value: string; accent?: boolean; style?: React.CSSProperties }) {
  const [copied, setCopied] = React.useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={style}>
      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-x9-text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        background: 'var(--color-x9-surface)',
        border: `1px solid ${accent ? 'rgba(0,255,136,0.2)' : 'var(--color-x9-border)'}`,
        borderRadius: 8,
        padding: '10px 14px',
      }}>
        <div className="x9-mono" style={{ fontSize: 13, color: accent ? 'var(--color-x9-accent)' : 'var(--color-x9-text)', wordBreak: 'break-all', flex: 1 }}>
          {value}
        </div>
        <button
          onClick={copy}
          style={{
            flexShrink: 0,
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            fontSize: 11,
            fontFamily: 'var(--font-mono)',
            color: copied ? 'var(--color-x9-accent)' : 'var(--color-x9-text-dim)',
            padding: '2px 6px',
            borderRadius: 4,
            transition: 'color 150ms ease',
          }}
        >
          {copied ? 'copied' : 'copy'}
        </button>
      </div>
    </div>
  );
}
