export default function StatusBadge({ status }: { status: 'active' | 'paused' | 'blocked' | 'stopped' | 'creating' }) {
  const colors = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    blocked: 'bg-red-500/20 text-red-400',
    stopped: 'bg-zinc-500/20 text-zinc-400',
    creating: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${colors[status]}`}>
      {status.toUpperCase()}
    </span>
  );
}
