'use client';

import { useModal, useAccounts } from '@phantom/react-sdk';

export default function WalletButton() {
  const { open } = useModal();
  const accounts = useAccounts();
  const solanaAccount = accounts?.find((a) => a.addressType === 'Solana');

  if (solanaAccount) {
    const addr = solanaAccount.address;
    return (
      <button style={{
        padding: '8px 16px',
        background: 'var(--color-x9-surface-2)',
        border: '1px solid var(--color-x9-border)',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: 'var(--font-mono)',
        color: 'var(--color-x9-text)',
        cursor: 'default',
      }}>
        {addr.slice(0, 4)}...{addr.slice(-4)}
      </button>
    );
  }

  return (
    <button onClick={() => open()} className="x9-btn-primary" style={{ fontSize: 13 }}>
      Connect Wallet
    </button>
  );
}
