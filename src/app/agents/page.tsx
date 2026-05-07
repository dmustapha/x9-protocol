'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AgentSummary {
  id: string;
  name: string;
  status: string;
  snsDomain: string | null;
  agentPublicKey: string;
  metaplexNftAddress: string | null;
  createdAt: string;
}

export default function AgentsDirectoryPage() {
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((data) => { setAgents(data.agents ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="x9-main-container" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>
            Solana Name Service · SNS Identity
          </div>
          <h1 className="x9-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--color-x9-text)', margin: 0 }}>
            Agent Directory
          </h1>
        </div>
        <Link href="/deploy" className="x9-btn-primary">+ Deploy Agent</Link>
      </div>

      {loading ? (
        <div style={{ color: 'var(--color-x9-text-dim)', fontSize: 13 }}>Loading agents...</div>
      ) : agents.length === 0 ? (
        <div className="x9-card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 13, color: 'var(--color-x9-text-muted)' }}>No agents deployed yet.</div>
          <Link href="/deploy" className="x9-btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>Deploy your first agent</Link>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {agents.map((agent) => (
            <AgentRow key={agent.id} agent={agent} />
          ))}
        </div>
      )}
    </div>
  );
}

function AgentRow({ agent }: { agent: AgentSummary }) {
  const statusColor = agent.status === 'active'
    ? 'var(--color-x9-accent)'
    : agent.status === 'blocked'
    ? 'var(--color-x9-danger)'
    : 'var(--color-x9-text-muted)';

  const shortKey = agent.agentPublicKey
    ? agent.agentPublicKey.slice(0, 6) + '...' + agent.agentPublicKey.slice(-4)
    : '—';

  return (
    <Link href={`/agent/${agent.id}`} style={{ textDecoration: 'none' }}>
      <div className="x9-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 200ms' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-x9-text)', fontFamily: 'var(--font-mono)' }}>
              {agent.name}
            </div>
            {agent.snsDomain && (
              <div style={{ fontSize: 12, color: 'var(--color-x9-accent)', marginTop: 2 }}>
                {agent.snsDomain}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--color-x9-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wallet</div>
            <div className="x9-mono" style={{ fontSize: 12, color: 'var(--color-x9-text-dim)' }}>{shortKey}</div>
          </div>
          {agent.metaplexNftAddress && agent.metaplexNftAddress !== 'registration-pending' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 10, color: 'var(--color-x9-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NFT</div>
              <div className="x9-mono" style={{ fontSize: 11, color: 'var(--color-x9-accent)' }}>
                {agent.metaplexNftAddress.slice(0, 6)}...
              </div>
            </div>
          )}
          <span style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: statusColor }}>
            {agent.status}
          </span>
        </div>
      </div>
    </Link>
  );
}
