import Link from 'next/link';
import StatusBadge from '@/components/shared/StatusBadge';
import type { AgentResponse } from '@/types';

export default function AgentCard({ agent }: { agent: AgentResponse }) {
  return (
    <Link href={`/agent/${agent.id}`} className="block bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition">
      <div className="flex justify-between items-start">
        <div>
          <div className="font-semibold">{agent.name}</div>
          <div className="text-xs text-zinc-500 mt-1">{agent.strategyText.slice(0, 60)}...</div>
        </div>
        <StatusBadge status={agent.status as 'active' | 'paused' | 'blocked' | 'stopped'} />
      </div>
    </Link>
  );
}
