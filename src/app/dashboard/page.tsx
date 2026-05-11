'use client';

import { useEffect, useRef, useState } from 'react';
import { useAccounts } from '@phantom/react-sdk';
import TradeFeed from '@/components/dashboard/TradeFeed';
import BlockEventLog from '@/components/dashboard/BlockEventLog';
import PortfolioCard from '@/components/dashboard/PortfolioCard';
import type { DashboardOverview } from '@/types';
import Link from 'next/link';

function useFadeIn(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true); }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, style: { opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity 400ms ease, transform 400ms ease' } };
}

export default function DashboardPage() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const accounts = useAccounts();
  const walletAddress = accounts?.find((a) => a.addressType === 'Solana')?.address ?? '';
  const fade1 = useFadeIn();
  const fade2 = useFadeIn();
  const fade3 = useFadeIn();

  useEffect(() => {
    const url = walletAddress
      ? `/api/dashboard/overview?wallet=${walletAddress}`
      : '/api/dashboard/overview';
    const load = () =>
      fetch(url)
        .then((r) => r.json())
        .then(setOverview)
        .catch(() => null);
    load();
    const interval = setInterval(load, 30_000);
    return () => clearInterval(interval);
  }, [walletAddress]);

  // Guard: null (loading) OR malformed response (e.g. error shape from API)
  if (!overview || typeof overview.totalPnl !== 'number') {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '40vh' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-x9-text-muted)', fontSize: 14 }}>
          <span className="x9-status-dot x9-animate-pulse-dot" />
          Syncing agent data...
        </div>
      </div>
    );
  }

  const pnlPositive = overview.totalPnl >= 0;

  return (
    <div className="x9-main-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <span className="x9-status-dot x9-animate-pulse-dot" />
            <span style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-x9-text-muted)' }}>
              Live Agent Feed
            </span>
          </div>
          <h1 className="x9-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-x9-text)', margin: 0 }}>
            Dashboard
          </h1>
        </div>
        <Link href="/deploy" className="x9-btn-primary">
          + Deploy Agent
        </Link>
      </div>

      {/* Stat row */}
      <div ref={fade1.ref} style={{ ...fade1.style, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        <StatCard label="Total Agents" value={overview.totalAgents} />
        <StatCard label="Active Agents" value={overview.activeAgents} accent />
        <StatCard label="Total Trades" value={overview.totalTrades} />
        <StatCard
          label="Total P&L"
          value={`${pnlPositive ? '+' : ''}${overview.totalPnl.toFixed(4)} SOL`}
          accent={pnlPositive}
          danger={!pnlPositive}
        />
      </div>

      {/* Main bento */}
      <div ref={fade2.ref} style={fade2.style} className="x9-bento">
        {/* Trade feed — wide */}
        <div className="x9-col-8">
          <TradeFeed trades={overview.recentTrades} />
        </div>
        {/* Block event log — tall */}
        <div className="x9-col-4 x9-row-2">
          <BlockEventLog events={overview.blockEvents} />
        </div>
        {/* Portfolio + Policy row */}
        <div className="x9-col-4">
          {walletAddress && <PortfolioCard walletAddress={walletAddress} />}
        </div>
        <div className="x9-col-4">
          <PolicySummary overview={overview} />
        </div>
      </div>

      {/* Footer note */}
      <div ref={fade3.ref} style={{ ...fade3.style, fontSize: 11, color: 'var(--color-x9-text-dim)', borderTop: '1px solid var(--color-x9-border)', paddingTop: 12 }}>
        Data refreshes every 30s · Policy enforcement via Swig · Trades routed through Jupiter
      </div>
    </div>
  );
}

function StatCard({ label, value, accent, danger }: { label: string; value: string | number; accent?: boolean; danger?: boolean }) {
  const color = accent ? 'var(--color-x9-accent)' : danger ? 'var(--color-x9-danger)' : 'var(--color-x9-text)';
  return (
    <div className="x9-card">
      <div className="x9-card-label">{label}</div>
      <div className="x9-mono" style={{ fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

function PolicySummary({ overview }: { overview: DashboardOverview }) {
  return (
    <div className="x9-card">
      <div className="x9-card-label">Policy Engine</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>Agents Running</div>
          <div className="x9-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-x9-accent)' }}>
            {overview.activeAgents}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>Blocks Today</div>
          <div className="x9-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-x9-danger)' }}>
            {overview.blockEvents?.length ?? 0}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>Enforcement</div>
          <span className="x9-badge x9-badge--green">Swig · LIVE</span>
        </div>
      </div>
    </div>
  );
}
