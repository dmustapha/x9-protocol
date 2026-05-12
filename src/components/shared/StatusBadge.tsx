const STATUS_META: Record<string, { label: string; color: string }> = {
  active:   { label: 'Active',   color: 'bg-green-500/20 text-green-400' },
  paused:   { label: 'Ready',    color: 'bg-amber-500/20 text-amber-400' },
  blocked:  { label: 'Blocked',  color: 'bg-red-500/20 text-red-400' },
  stopped:  { label: 'Stopped',  color: 'bg-zinc-500/20 text-zinc-400' },
  creating: { label: 'Creating', color: 'bg-blue-500/20 text-blue-400' },
};

export default function StatusBadge({ status }: { status: 'active' | 'paused' | 'blocked' | 'stopped' | 'creating' }) {
  const { label, color } = STATUS_META[status] ?? { label: status, color: 'bg-zinc-500/20 text-zinc-400' };
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium tracking-wide ${color}`}>
      {label}
    </span>
  );
}
