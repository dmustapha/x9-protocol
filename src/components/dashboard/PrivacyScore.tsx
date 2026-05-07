import type { PrivacyScore as PrivacyScoreType } from '@/types';

export default function PrivacyScore({ score }: { score: PrivacyScoreType }) {
  const checks = [
    { label: 'One-time wallet', value: score.oneTimeWallet },
    { label: 'No onchain link', value: score.noOnchainLink },
    { label: 'Jito MEV protected', value: score.jitoProtected },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <h3 className="font-semibold mb-4">Privacy Score</h3>
      <div className="space-y-2">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-sm">
            <span className={c.value ? 'text-green-400' : 'text-zinc-600'}>{c.value ? '✓' : '✗'}</span>
            <span className={c.value ? 'text-zinc-200' : 'text-zinc-600'}>{c.label}</span>
          </div>
        ))}
        <div className="text-xs text-zinc-500 mt-2">Vanish loan: {score.loanAmount}</div>
      </div>
    </div>
  );
}
