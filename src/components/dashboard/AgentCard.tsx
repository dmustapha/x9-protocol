import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import type { AgentResponse } from '@/types';

export default function AgentCard({ agent }: { agent: AgentResponse }) {
  return (
    <Link href={`/agent/${agent.id}`} className="x9-card" style={{ display: 'block', textDecoration: 'none' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 15, color: 'var(--color-x9-text)' }}>{agent.name}</div>
          <div style={{ fontSize: 12, color: 'var(--color-x9-text-dim)', marginTop: 4 }}>{agent.strategyText.slice(0, 60)}...</div>
        </div>
        <StatusBadge status={agent.status as 'active' | 'paused' | 'blocked' | 'stopped'} />
      </div>
    </Link>
  );
}
