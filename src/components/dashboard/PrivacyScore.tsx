import type { PrivacyScore as PrivacyScoreType } from '@/types';

export default function PrivacyScore({ score }: { score: PrivacyScoreType }) {
  const checks = [
    { label: 'One-time wallet',                value: score.oneTimeWallet },
    { label: 'Not linked to your main wallet', value: score.noOnchainLink },
    { label: 'Front-run protected (Jito)',      value: score.jitoProtected },
  ];

  return (
    <div className="x9-card">
      <div className="x9-card-label">Privacy Score</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {checks.map((c) => (
          <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
            <span style={{ color: c.value ? 'var(--color-x9-accent)' : 'var(--color-x9-text-dim)' }}>{c.value ? '✓' : '✗'}</span>
            <span style={{ color: c.value ? 'var(--color-x9-text)' : 'var(--color-x9-text-dim)' }}>{c.label}</span>
          </div>
        ))}
        <div style={{ fontSize: 11, color: 'var(--color-x9-text-dim)', marginTop: 4 }}>Vanish routing: {score.loanAmount}</div>
      </div>
    </div>
  );
}
