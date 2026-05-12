'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface AgentSummary {
  id: string;
  name: string;
  status: string;
  strategyText: string;
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
          <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>
            Agent identities registered on Solana with .sol domains
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

const STATUS_DISPLAY: Record<string, { label: string; color: string; border: string }> = {
  active:   { label: 'Active',   color: 'var(--color-x9-accent)',   border: 'var(--color-x9-accent)' },
  paused:   { label: 'Ready',    color: '#f59e0b',                  border: '#f59e0b' },
  blocked:  { label: 'Blocked',  color: 'var(--color-x9-danger)',   border: 'var(--color-x9-danger)' },
  stopped:  { label: 'Stopped',  color: 'var(--color-x9-text-dim)', border: 'transparent' },
  creating: { label: 'Creating', color: 'var(--color-x9-cyan)',     border: 'var(--color-x9-cyan)' },
};

function AgentRow({ agent }: { agent: AgentSummary }) {
  const s = STATUS_DISPLAY[agent.status] ?? STATUS_DISPLAY.stopped;
  const shortKey = agent.agentPublicKey
    ? agent.agentPublicKey.slice(0, 6) + '…' + agent.agentPublicKey.slice(-4)
    : '—';
  const preview = agent.strategyText?.slice(0, 72);

  return (
    <Link href={`/agent/${agent.id}`} style={{ textDecoration: 'none' }}>
      <div className="x9-card" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        cursor: 'pointer', transition: 'border-color 200ms', padding: '16px 20px',
        borderLeft: `3px solid ${s.border}`,
      }}>
        {/* Left — identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-x9-text)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {agent.name}
            </div>
            {agent.snsDomain && (
              <div style={{ fontSize: 12, color: 'var(--color-x9-accent)', marginTop: 1 }}>{agent.snsDomain}</div>
            )}
            {preview && (
              <div style={{ fontSize: 13, color: 'var(--color-x9-text-muted)', marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 380 }}>
                {preview}{(agent.strategyText?.length ?? 0) > 72 ? '…' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Right — metadata */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Wallet</div>
            <div className="x9-mono" style={{ fontSize: 12, color: 'var(--color-x9-text-muted)' }}>{shortKey}</div>
          </div>
          {agent.metaplexNftAddress && agent.metaplexNftAddress !== 'registration-pending' && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>NFT</div>
              <div className="x9-mono" style={{ fontSize: 12, color: 'var(--color-x9-accent)' }}>{agent.metaplexNftAddress.slice(0, 6)}…</div>
            </div>
          )}
          <span style={{
            fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
            color: s.color, minWidth: 52, textAlign: 'right',
          }}>
            {s.label}
          </span>
        </div>
      </div>
    </Link>
  );
}
