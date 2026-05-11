'use client';

import { useEffect, useState } from 'react';

interface PortfolioData {
  sol: number;
  usdc: number;
  totalUsdValue: number;
  source: 'goldrush' | 'mock';
}

interface Props {
  walletAddress: string;
}

export default function PortfolioCard({ walletAddress }: Props) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);

  useEffect(() => {
    if (!walletAddress) return;
    fetch(`/api/portfolio?wallet=${walletAddress}`)
      .then((r) => r.json())
      .then(setPortfolio)
      .catch(() => null);
  }, [walletAddress]);

  if (!portfolio) {
    return (
      <div className="x9-card">
        <div className="x9-card-label">Connected Wallet</div>
        <div style={{ color: 'var(--color-x9-text-dim)', fontSize: 12 }}>Loading...</div>
      </div>
    );
  }

  return (
    <div className="x9-card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div className="x9-card-label">Connected Wallet</div>
        <span className={`x9-badge ${portfolio.source === 'goldrush' ? 'x9-badge--green' : 'x9-badge--yellow'}`}>
          {portfolio.source === 'goldrush' ? 'GoldRush · LIVE' : 'Mock data'}
        </span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>SOL Balance</div>
          <div className="x9-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-x9-accent)' }}>
            {portfolio.sol.toFixed(4)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>USDC Balance</div>
          <div className="x9-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-x9-text)' }}>
            {portfolio.usdc.toFixed(2)}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: 'var(--color-x9-text-muted)', marginBottom: 4 }}>Total Value</div>
          <div className="x9-mono" style={{ fontSize: 20, fontWeight: 700, color: 'var(--color-x9-text)' }}>
            ${portfolio.totalUsdValue.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
