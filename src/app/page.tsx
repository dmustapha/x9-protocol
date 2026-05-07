'use client';

import { useEffect, useRef, useState, Fragment } from 'react';
import Link from 'next/link';

// ── Counter animation hook ─────────────────────────────
function useCounter(target: number, duration: number, trigger: boolean) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let startTime: number | null = null;
    const tick = (ts: number) => {
      if (!startTime) startTime = ts;
      const progress = Math.min((ts - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [trigger, target, duration]);
  return value;
}

const SECTIONS = ['hero', 'feed', 'policy', 'deploy'] as const;
type SectionId = typeof SECTIONS[number];

const TRADE_ROWS = [
  { type: 'BUY',     pair: 'SOL/USDC',  pnl: '+$12.40',      time: '2s ago' },
  { type: 'BUY',     pair: 'JUP/USDC',  pnl: '+$8.20',       time: '14s ago' },
  { type: 'SELL',    pair: 'RAY/USDC',  pnl: '-$3.10',       time: '31s ago' },
  { type: 'BUY',     pair: 'BONK/USDC', pnl: '+$5.70',       time: '48s ago' },
  { type: 'BLOCKED', pair: 'SOL/USDC',  pnl: 'max drawdown', time: '1m ago' },
  { type: 'BUY',     pair: 'WIF/USDC',  pnl: '+$2.30',       time: '1m 22s ago' },
  { type: 'BUY',     pair: 'SOL/USDC',  pnl: '+$7.80',       time: '2m ago' },
] as const;

const RULE_ROWS = [
  { label: 'Max Trade Size',   value: '2 SOL' },
  { label: 'Daily Loss Limit', value: '5 SOL' },
  { label: 'Token Allowlist',  value: 'SOL / BTC / ETH only' },
  { label: 'Cooldown',         value: '90s between trades' },
];

const SPONSORS = [
  { name: 'Swig Wallet', desc: 'Policy enforcement', color: '#00ff88' },
  { name: 'Claude AI',   desc: 'Trade reasoning',    color: '#06b6d4' },
  { name: 'Jupiter',     desc: 'Swap aggregator',    color: '#a855f7' },
  { name: 'CoinGecko',   desc: 'Price feeds',        color: '#f97316' },
  { name: 'Solana',      desc: 'Settlement layer',   color: '#06b6d4' },
  { name: 'SNS',         desc: '.sol agent identity', color: '#00ff88' },
];

// ── Main Page ──────────────────────────────────────────
export default function HomePage() {
  const [activeSection, setActiveSection] = useState<SectionId>('hero');
  const [heroVisible,   setHeroVisible]   = useState(false);
  const [policyVisible, setPolicyVisible] = useState(false);
  const [activeRow,     setActiveRow]     = useState(0);
  const [liveStats,     setLiveStats]     = useState({ agents: 44, trades: 20, blocks: 1 });

  const heroRef   = useRef<HTMLElement>(null);
  const feedRef   = useRef<HTMLElement>(null);
  const policyRef = useRef<HTMLElement>(null);
  const deployRef = useRef<HTMLElement>(null);

  // Fetch real network stats
  useEffect(() => {
    fetch('/api/dashboard/overview')
      .then(r => r.json())
      .then(d => setLiveStats({
        agents: d.totalAgents ?? 44,
        trades: d.totalTrades ?? 20,
        blocks: d.blockEvents?.length ?? 1,
      }))
      .catch(() => {});
  }, []);

  const agentCount = useCounter(liveStats.agents, 1800, heroVisible);
  const tradeCount = useCounter(liveStats.trades, 1800, heroVisible);
  const blockCount = useCounter(liveStats.blocks, 1800, heroVisible);

  // Floating nav — section tracking
  useEffect(() => {
    const refs = [heroRef, feedRef, policyRef, deployRef];
    const ids: SectionId[] = ['hero', 'feed', 'policy', 'deploy'];
    const observers = refs.map((ref, i) => {
      const obs = new IntersectionObserver(
        ([e]) => { if (e.isIntersecting) setActiveSection(ids[i]); },
        { threshold: 0.3, rootMargin: '-60px 0px -30% 0px' }
      );
      if (ref.current) obs.observe(ref.current);
      return obs;
    });
    return () => observers.forEach(o => o.disconnect());
  }, []);

  // Hero counters trigger
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setHeroVisible(true); },
      { threshold: 0.3 }
    );
    if (heroRef.current) obs.observe(heroRef.current);
    return () => obs.disconnect();
  }, []);

  // Policy rules slide-in
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setPolicyVisible(true); },
      { threshold: 0.2, rootMargin: '-40px' }
    );
    if (policyRef.current) obs.observe(policyRef.current);
    return () => obs.disconnect();
  }, []);

  // Live feed pulse
  useEffect(() => {
    const id = setInterval(() => setActiveRow(r => (r + 1) % 7), 2400);
    return () => clearInterval(id);
  }, []);

  const scrollTo = (id: SectionId) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <>
      {/* ── Floating nav ─────────────────────────────── */}
      <nav className="x9-hc-float-nav" aria-label="Page sections">
        {SECTIONS.map(id => (
          <button
            key={id}
            className={`x9-hc-float-dot${activeSection === id ? ' x9-hc-float-dot--active' : ''}`}
            onClick={() => scrollTo(id)}
            aria-label={`Go to ${id} section`}
            aria-current={activeSection === id ? 'true' : undefined}
          />
        ))}
      </nav>

      {/* ── Section 1: Hero ──────────────────────────── */}
      <section id="hero" ref={heroRef} className="x9-hc-section x9-hc-hero">
        <div className="x9-hc-hero-left">
          <div className="x9-hc-live-label">
            <span className="x9-status-dot x9-animate-pulse-dot" />
            Live Network
          </div>

          <h1 className="x9-hc-headline">
            Autonomous<br />
            AI agents.<br />
            <span className="x9-hc-accent-text">Cryptographic</span><br />
            policy.
          </h1>

          <p className="x9-hc-subtitle">
            Deploy AI trading agents on Solana with Swig enforcement. Claude reasons,
            policy guards, Jupiter executes — all without counterparty risk.
          </p>

          <div className="x9-hc-cta-row">
            <Link href="/deploy" className="x9-btn-primary">Deploy Agent</Link>
            <Link href="/dashboard" className="x9-hc-btn-ghost">View Dashboard →</Link>
          </div>

          {/* Ticker */}
          <div className="x9-hc-ticker-wrap">
            <div className="x9-hc-ticker-track">
              {[0, 1].map(i => (
                <span key={i} className="x9-hc-ticker-inner">
                  <span className="x9-hc-tick-item"><span className="x9-hc-tick-label">SOL</span> $182.40 <span className="x9-hc-tick-pos">+3.2%</span></span>
                  <span className="x9-hc-tick-sep">·</span>
                  <span className="x9-hc-tick-item"><span className="x9-hc-tick-label">BTC</span> $94,218 <span className="x9-hc-tick-pos">+1.8%</span></span>
                  <span className="x9-hc-tick-sep">·</span>
                  <span className="x9-hc-tick-item"><span className="x9-hc-tick-label">ETH</span> $3,412 <span className="x9-hc-tick-neg">-0.4%</span></span>
                  <span className="x9-hc-tick-sep">·</span>
                  <span className="x9-hc-tick-item"><span className="x9-hc-tick-label">JUP</span> $1.24 <span className="x9-hc-tick-pos">+5.6%</span></span>
                  <span className="x9-hc-tick-sep">·</span>
                  <span className="x9-hc-tick-item"><span className="x9-hc-tick-label">PYTH</span> $0.38 <span className="x9-hc-tick-neg">-1.2%</span></span>
                  <span className="x9-hc-tick-sep">·</span>
                  <span className="x9-hc-tick-item"><span className="x9-hc-tick-label">BONK</span> $0.000042 <span className="x9-hc-tick-pos">+8.4%</span></span>
                  <span className="x9-hc-tick-sep">·</span>
                </span>
              ))}
            </div>
          <p style={{ fontSize: '10px', color: 'rgba(255,255,255,0.3)', marginTop: '4px', marginLeft: '2px', letterSpacing: '0.02em' }}>
            Prices indicative · powered by CoinGecko
          </p>
          </div>

          <div className="x9-hc-stats-row">
            <div className="x9-hc-stat">
              <div className="x9-hc-stat-value x9-mono">{agentCount}</div>
              <div className="x9-hc-stat-label">Active Agents</div>
            </div>
            <div className="x9-hc-stat-divider" />
            <div className="x9-hc-stat">
              <div className="x9-hc-stat-value x9-mono">{tradeCount}</div>
              <div className="x9-hc-stat-label">Trades Today</div>
            </div>
            <div className="x9-hc-stat-divider" />
            <div className="x9-hc-stat">
              <div className="x9-hc-stat-value x9-mono">{blockCount}</div>
              <div className="x9-hc-stat-label">Blocked Events</div>
            </div>
          </div>
        </div>

        <div className="x9-hc-hero-right" aria-hidden="true">
          <NetworkGraph />
        </div>
      </section>

      {/* ── Section 2: Feed + Architecture ───────────── */}
      <section id="feed" ref={feedRef} className="x9-hc-section x9-hc-feed">
        <div className="x9-hc-feed-left">
          <div className="x9-hc-section-eyebrow">How it works</div>
          <h2 className="x9-hc-section-title">Three-layer<br />execution stack</h2>

          <div className="x9-hc-flow-steps">
            {[
              { num: '01', title: 'AI Reasoning',       desc: 'Claude Haiku analyzes RSI, volume, and market context with tool_use structured output.' },
              { num: '02', title: 'Policy Enforcement', desc: 'Swig Smart Wallet enforces per-trade limits, daily caps, and token allowlists before execution.' },
              { num: '03', title: 'Onchain Execution',  desc: 'Jupiter aggregates the best swap route. Transaction settles on Solana in under 400ms.' },
            ].map(step => (
              <div key={step.num} className="x9-hc-flow-step">
                <div className="x9-hc-flow-num x9-mono">{step.num}</div>
                <div>
                  <div className="x9-hc-flow-title">{step.title}</div>
                  <div className="x9-hc-flow-desc">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="x9-hc-chain-pills">
            {['CoinGecko', 'Claude AI', 'Swig', 'Jupiter', 'Solana'].map((p, i, arr) => (
              <Fragment key={p}>
                <span className="x9-hc-pill">{p}</span>
                {i < arr.length - 1 && <span className="x9-hc-pill-arrow">→</span>}
              </Fragment>
            ))}
          </div>
        </div>

        <div className="x9-hc-feed-right">
          <div className="x9-hc-feed-card">
            <div className="x9-hc-feed-card-header">
              <span className="x9-hc-feed-title">Trade Feed</span>
              <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.35)', marginLeft: 'auto', marginRight: '8px' }}>sample data</span>
              <span className="x9-status-dot x9-animate-pulse-dot" />
            </div>
            <div className="x9-hc-trade-rows">
              {TRADE_ROWS.map((row, i) => (
                <div
                  key={i}
                  className={`x9-hc-trade-row${activeRow === i ? ' x9-hc-trade-row--active' : ''}`}
                >
                  <span className={`x9-hc-trade-type x9-hc-trade-type--${row.type.toLowerCase()}`}>
                    {row.type}
                  </span>
                  <span className="x9-hc-trade-pair x9-mono">{row.pair}</span>
                  <span className={`x9-hc-trade-pnl x9-mono ${
                    row.type === 'SELL' ? 'x9-hc-neg' :
                    row.type === 'BLOCKED' ? 'x9-hc-dim' : 'x9-hc-pos'
                  }`}>
                    {row.pnl}
                  </span>
                  <span className="x9-hc-trade-time">{row.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 3: Policy + Agent Status ─────────── */}
      <section id="policy" ref={policyRef} className="x9-hc-section x9-hc-policy">
        <div className="x9-hc-policy-left">
          <div className="x9-hc-section-eyebrow">Policy Engine</div>
          <h2 className="x9-hc-section-title">Rules that<br />actually enforce</h2>

          <div className="x9-hc-rule-rows">
            {RULE_ROWS.map((row, i) => (
              <div
                key={i}
                className={`x9-hc-rule-row${policyVisible ? ' x9-hc-rule-row--visible' : ''}`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                <div className="x9-hc-rule-label">{row.label}</div>
                <div className="x9-hc-rule-value x9-mono">{row.value}</div>
                <span className="x9-badge x9-badge--green">ACTIVE</span>
              </div>
            ))}
          </div>

          <div className="x9-hc-code-block">
            <div className="x9-hc-code-header">
              <span className="x9-hc-code-dot" style={{ background: '#ef4444' }} />
              <span className="x9-hc-code-dot" style={{ background: '#f59e0b' }} />
              <span className="x9-hc-code-dot" style={{ background: '#22c55e' }} />
              <span className="x9-hc-code-filename">agent-engine.ts</span>
            </div>
            <pre className="x9-hc-code-body x9-mono">
              <span className="x9-hc-kw">const</span>{' '}result{' '}={' '}
              <span className="x9-hc-kw">await</span>{'\n'}
              {'  '}SwigClient<span className="x9-hc-punct">.</span>
              <span className="x9-hc-fn">enforcePolicy</span>
              <span className="x9-hc-punct">{'({'}</span>{'\n'}
              {'    '}wallet<span className="x9-hc-punct">:</span>{' '}
              agent<span className="x9-hc-punct">.</span>swigAddress
              <span className="x9-hc-punct">,</span>{'\n'}
              {'    '}action<span className="x9-hc-punct">:</span>{' '}
              <span className="x9-hc-str">&quot;trade&quot;</span>
              <span className="x9-hc-punct">,</span>{'\n'}
              {'    '}amount<span className="x9-hc-punct">:</span>{' '}
              tradeSize<span className="x9-hc-punct">,</span>{'\n'}
              {'  '}<span className="x9-hc-punct">{'}'}</span>
              <span className="x9-hc-punct">)</span>
            </pre>
          </div>
        </div>

        <div className="x9-hc-policy-right">
          <div className="x9-hc-agent-card">
            <div className="x9-hc-agent-card-header">
              <span className="x9-hc-agent-big x9-mono">42</span>
              <span className="x9-badge x9-badge--green">RUNNING</span>
            </div>
            <div className="x9-hc-agent-card-label">Active Agents</div>

            <div className="x9-hc-agent-rows">
              {[
                { name: 'Alpha-01', pnl: '+2.4 SOL' },
                { name: 'Hedge-03', pnl: '+0.8 SOL' },
                { name: 'Scalp-07', pnl: '+5.1 SOL' },
                { name: 'Guard-12', pnl: '+0.3 SOL' },
              ].map(a => (
                <div key={a.name} className="x9-hc-agent-row">
                  <span className="x9-hc-agent-name x9-mono">{a.name}</span>
                  <span className="x9-hc-agent-pnl x9-hc-pos x9-mono">{a.pnl}</span>
                </div>
              ))}
            </div>

            <div className="x9-hc-swig-badge">
              <span className="x9-status-dot" style={{ background: '#06b6d4' }} />
              Swig · LIVE
            </div>
          </div>
        </div>
      </section>

      {/* ── Section 4: Deploy ────────────────────────── */}
      <section id="deploy" ref={deployRef} className="x9-hc-section x9-hc-deploy">
        <div className="x9-hc-deploy-left">
          <div className="x9-hc-section-eyebrow">Get Started</div>
          <h2 className="x9-hc-deploy-title">
            Deploy your first<br />
            <span className="x9-hc-accent-text">AI trading agent</span>
          </h2>
          <p className="x9-hc-deploy-desc">
            Define a strategy in plain English. Claude generates policy rules. Swig
            enforces them on-chain. Your agent starts trading in minutes.
          </p>
          <div className="x9-hc-cta-row">
            <Link href="/deploy" className="x9-btn-primary">Deploy Now →</Link>
            <Link href="/proof"  className="x9-hc-btn-ghost">View Proof</Link>
          </div>
        </div>

        <div className="x9-hc-deploy-right">
          <div className="x9-hc-sponsor-grid">
            {SPONSORS.map(s => (
              <div
                key={s.name}
                className="x9-hc-sponsor-card"
                style={{ '--hc-sponsor-color': s.color } as React.CSSProperties}
              >
                <div className="x9-hc-sponsor-name x9-mono">{s.name}</div>
                <div className="x9-hc-sponsor-desc">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

// ── Network Graph SVG ──────────────────────────────────
function NetworkGraph() {
  return (
    <svg
      className="x9-hc-network-svg"
      viewBox="0 0 520 620"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <pattern id="hcGrid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(0,255,136,0.06)" strokeWidth="0.5" />
        </pattern>
        <radialGradient id="hcGlowGreen" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#00ff88" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00ff88" stopOpacity="0"   />
        </radialGradient>
        <radialGradient id="hcGlowCyan" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#06b6d4" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0"   />
        </radialGradient>
        <filter id="hcBlur">
          <feGaussianBlur stdDeviation="8" />
        </filter>
      </defs>

      <rect width="520" height="620" fill="url(#hcGrid)" />

      {/* Ambient glow */}
      <circle cx="260" cy="200" r="80" fill="url(#hcGlowGreen)" filter="url(#hcBlur)" />
      <circle cx="420" cy="420" r="60" fill="url(#hcGlowCyan)"  filter="url(#hcBlur)" />

      {/* Expanding rings on core */}
      <circle cx="260" cy="200" r="36" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.4" className="x9-hc-ring-a" />
      <circle cx="260" cy="200" r="28" stroke="#00ff88" strokeWidth="1" strokeOpacity="0.3" className="x9-hc-ring-b" />

      {/* Edges — drawn via stroke-dashoffset animation */}
      <line x1="260" y1="200" x2="140" y2="100" stroke="#00ff88" strokeWidth="1.5" strokeDasharray="1000" className="x9-hc-edge x9-hc-edge-1" />
      <line x1="260" y1="200" x2="400" y2="110" stroke="#00ff88" strokeWidth="1.5" strokeDasharray="1000" className="x9-hc-edge x9-hc-edge-2" />
      <line x1="260" y1="200" x2="100" y2="300" stroke="#06b6d4" strokeWidth="1"   strokeDasharray="1000" className="x9-hc-edge x9-hc-edge-3" />
      <line x1="260" y1="200" x2="420" y2="310" stroke="#06b6d4" strokeWidth="1"   strokeDasharray="1000" className="x9-hc-edge x9-hc-edge-4" />
      <line x1="260" y1="200" x2="180" y2="420" stroke="#00ff88" strokeWidth="1"   strokeDasharray="1000" className="x9-hc-edge x9-hc-edge-5" />
      <line x1="260" y1="200" x2="380" y2="500" stroke="#06b6d4" strokeWidth="1"   strokeDasharray="1000" className="x9-hc-edge x9-hc-edge-6" />
      <line x1="260" y1="200" x2="260" y2="540" stroke="#00ff88" strokeWidth="1"   strokeDasharray="1000" className="x9-hc-edge x9-hc-edge-7" />
      <line x1="420" y1="310" x2="380" y2="500" stroke="#06b6d4" strokeWidth="0.5" strokeOpacity="0.3" />

      {/* Nodes */}
      <GraphNode cx={260} cy={200} r={18} color="#00ff88" label="x9.core"  side="right" core />
      <GraphNode cx={140} cy={100} r={10} color="#00ff88" label="Alpha-01" side="left" />
      <GraphNode cx={400} cy={110} r={10} color="#06b6d4" label="Claude AI" side="right" />
      <GraphNode cx={100} cy={300} r={8}  color="#06b6d4" label="Scalp-07" side="left" />
      <GraphNode cx={420} cy={310} r={8}  color="#00ff88" label="Hedge-03" side="right" />
      <GraphNode cx={180} cy={420} r={10} color="#00ff88" label="Policy"   side="left" />
      <GraphNode cx={380} cy={500} r={8}  color="#06b6d4" label="Swig"     side="right" />
      <GraphNode cx={260} cy={540} r={8}  color="#00ff88" label="Jupiter"  side="right" />
    </svg>
  );
}

interface GraphNodeProps {
  cx: number; cy: number; r: number;
  color: string; label: string;
  side: 'left' | 'right'; core?: boolean;
}

function GraphNode({ cx, cy, r, color, label, side, core }: GraphNodeProps) {
  const tx = side === 'right' ? cx + r + 8 : cx - r - 8;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r + 4} fill={color} fillOpacity={0.08} />
      <circle
        cx={cx} cy={cy} r={r}
        fill="#09090b" stroke={color} strokeWidth={1.5}
        className={core ? 'x9-hc-node-core' : 'x9-hc-node'}
      />
      <circle cx={cx} cy={cy} r={Math.max(r - 4, 2)} fill={color} fillOpacity={0.4} />
      <text
        x={tx} y={cy + 4}
        fill={color} fontSize="10"
        textAnchor={side === 'right' ? 'start' : 'end'}
        fontFamily="'JetBrains Mono', monospace"
        opacity={0.8}
      >
        {label}
      </text>
    </g>
  );
}
