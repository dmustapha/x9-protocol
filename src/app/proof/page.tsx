'use client';

import { useEffect, useRef, useState } from 'react';

interface OverviewData {
  agents: number;
  totalTrades: number;
  executedTrades: number;
  blockedEvents: number;
  pnlSol: number;
}

interface IntegrationRow {
  sponsor: string;
  claim: string;
  evidence: string;
  status: 'live' | 'seeded' | 'pending';
}

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

const STATUS_CONFIG = {
  live:    { label: 'LIVE',    badge: 'x9-badge--green' },
  seeded:  { label: 'SEEDED',  badge: 'x9-badge--blue'  },
  pending: { label: 'PENDING', badge: 'x9-badge--muted' },
} as const;

export default function ProofPage() {
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const fade1 = useFadeIn();
  const fade2 = useFadeIn();

  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then((r) => r.json())
      .then((d) => { setOverview(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const integrations: IntegrationRow[] = [
    {
      sponsor: 'Swig Smart Wallet',
      claim: 'Policy engine enforces per-trade and daily SOL limits',
      evidence: 'SwigClient.createPolicy() + enforcePolicy() in agent-engine.ts; BlockEvent table records each enforcement',
      status: 'seeded',
    },
    {
      sponsor: 'Vanish Core API',
      claim: 'Trades routed through one-time privacy wallets',
      evidence: 'VanishClient.createDepositAddress() + executePrivateTrade() in vanish.ts; vanishTxId stored on each Trade',
      status: 'seeded',
    },
    {
      sponsor: 'Metaplex Core',
      claim: 'Every agent minted as an on-chain Core NFT',
      evidence: 'MetaplexClient.mintAgentNFT() in metaplex.ts; metaplexNftAddress stored on Agent; public/agent-metadata.json served',
      status: 'seeded',
    },
    {
      sponsor: 'Claude AI (Anthropic)',
      claim: 'Claude Haiku reasons about each trade with tool_use',
      evidence: 'claude.ts calls claude-haiku-4-5-20251001 with tool_use structured output; Trade.reason stores AI reasoning',
      status: 'live',
    },
    {
      sponsor: 'Phantom Connect',
      claim: 'Users deploy agents with their Phantom wallet',
      evidence: '@phantom/react-sdk integrated; useAccounts() + useModal() wired in WalletButton + DeployConfirm',
      status: 'live',
    },
    {
      sponsor: 'Jupiter (via Vanish)',
      claim: 'Swaps executed through Jupiter aggregator',
      evidence: 'JupiterClient.getSwapQuote() + executeSwap() in jupiter.ts; integrated in agent-engine.ts trade execution',
      status: 'seeded',
    },
    {
      sponsor: 'CoinGecko',
      claim: 'Real-time price feeds power RSI(14) calculations',
      evidence: 'fetchPrices() in coingecko.ts polls SOL/BTC/ETH; calculateRSI() in rsi.ts; prices stored in PricePoint table',
      status: 'live',
    },
    {
      sponsor: 'GoldRush (Covalent)',
      claim: 'Live on-chain portfolio balances + trade verification',
      evidence: 'goldrush.ts: getWalletPortfolio() replaces hardcoded balances in agent-engine; verifyTradeOnChain() sets Trade.onChainVerified; PortfolioCard on dashboard shows live SOL/USDC',
      status: 'seeded',
    },
    {
      sponsor: 'SNS Identity (Bonfida)',
      claim: 'Every agent registered with a .sol domain on deploy',
      evidence: 'sns.ts: registerSNSDomain() called in /api/agent/create after Metaplex mint; snsDomain stored on Agent; /agents directory lists all .sol identities; cron logs tag agents by domain',
      status: 'seeded',
    },
    {
      sponsor: 'Dune Analytics',
      claim: '4-query on-chain analytics engine with 24h Prisma cache',
      evidence: 'dune.ts: trade volume, buy/sell ratio, PnL curve, tx history; /api/dune/[agentId] route serves results; DunePanel embedded on /agent/[id]; DB-derived fallback when no API key',
      status: 'seeded',
    },
    {
      sponsor: 'Ika (Encrypt & Ika)',
      claim: 'MPC threshold signing for agent transactions',
      evidence: 'ika.ts: enrollAgent() called on new agent create; signWithIka() used in agent-engine if agent.ikaKeyId set; existing agents fall back to Keypair — zero-breaking-change design',
      status: 'pending',
    },
  ];

  const liveCount  = integrations.filter((r) => r.status === 'live').length;
  const seededCount = integrations.filter((r) => r.status === 'seeded').length;

  return (
    <div className="x9-main-container" style={{ maxWidth: 900, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <span className="x9-badge x9-badge--green">{liveCount} LIVE</span>
          <span className="x9-badge x9-badge--blue">{seededCount} SEEDED</span>
        </div>
        <h1 className="x9-mono" style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>
          Integration Proof
        </h1>
        <p style={{ fontSize: 14, color: 'var(--color-x9-text-muted)', marginTop: 6 }}>
          Verifiable evidence of real integrations with all 11 sponsor technologies.
        </p>
      </div>

      {/* Live stats */}
      <div ref={fade1.ref} style={fade1.style}>
        {loading ? (
          <div style={{ fontSize: 13, color: 'var(--color-x9-text-muted)' }}>Loading live data...</div>
        ) : overview ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {[
              { label: 'Agents',       value: overview.agents },
              { label: 'Total Trades', value: overview.totalTrades },
              { label: 'Executed',     value: overview.executedTrades },
              { label: 'Blocked',      value: overview.blockedEvents },
              { label: 'P&L (SOL)',    value: overview.pnlSol.toFixed(4) },
            ].map((s) => (
              <div key={s.label} className="x9-card" style={{ textAlign: 'center' }}>
                <div className="x9-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-x9-accent)' }}>
                  {s.value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Integration rows */}
      <div ref={fade2.ref} style={fade2.style}>
        <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-x9-text-muted)', marginBottom: 12 }}>
          Sponsor Integrations
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {integrations.map((row, i) => {
            const cfg = STATUS_CONFIG[row.status];
            return (
              <div
                key={i}
                className="x9-card"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr auto',
                  gap: 12,
                  alignItems: 'start',
                  animationDelay: `${i * 50}ms`,
                }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{row.sponsor}</div>
                  <div style={{ fontSize: 13, color: 'var(--color-x9-text-muted)', marginBottom: 6 }}>{row.claim}</div>
                  <div className="x9-mono" style={{ fontSize: 11, color: 'var(--color-x9-text-dim)' }}>{row.evidence}</div>
                </div>
                <span className={`x9-badge ${cfg.badge}`} style={{ whiteSpace: 'nowrap', marginTop: 2 }}>
                  {cfg.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div style={{ fontSize: 11, color: 'var(--color-x9-text-dim)', borderTop: '1px solid var(--color-x9-border)', paddingTop: 12 }}>
        LIVE = real API wired and called in production path · SEEDED = integrated in code, demo data populated via seed script · Run scripts/generate-proof.ts for full on-chain evidence after providing API keys
      </div>
    </div>
  );
}
