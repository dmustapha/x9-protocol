'use client';

import { useState } from 'react';
import { useModal, useAccounts, useDisconnect } from '@phantom/react-sdk';

export default function WalletButton() {
  const { open } = useModal();
  const { disconnect } = useDisconnect();
  const accounts = useAccounts();
  const solanaAccount = accounts?.find((a) => a.addressType === 'Solana');
  const [menuOpen, setMenuOpen] = useState(false);

  if (solanaAccount) {
    const addr = solanaAccount.address;
    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            padding: '8px 16px',
            background: 'var(--color-x9-surface-2)',
            border: '1px solid var(--color-x9-border)',
            borderRadius: 8,
            fontSize: 13,
            fontFamily: 'var(--font-mono)',
            color: 'var(--color-x9-text)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--color-x9-accent)', display: 'inline-block' }} />
          {addr.slice(0, 4)}...{addr.slice(-4)}
        </button>
        {menuOpen && (
          <div style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            background: 'var(--color-x9-surface-2)',
            border: '1px solid var(--color-x9-border-strong)',
            borderRadius: 8,
            overflow: 'hidden',
            zIndex: 50,
            minWidth: 140,
          }}>
            <button
              onClick={() => { disconnect(); setMenuOpen(false); }}
              style={{
                width: '100%',
                padding: '10px 16px',
                background: 'transparent',
                border: 'none',
                color: 'var(--color-x9-text-muted)',
                fontSize: 13,
                fontFamily: 'var(--font-mono)',
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-x9-surface)'; e.currentTarget.style.color = 'var(--color-x9-text)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--color-x9-text-muted)'; }}
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button onClick={() => open()} className="x9-btn-primary" style={{ fontSize: 13 }}>
      Connect Wallet
    </button>
  );
}
