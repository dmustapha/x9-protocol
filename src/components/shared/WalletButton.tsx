'use client';

import { useModal, useAccounts } from '@phantom/react-sdk';

export default function WalletButton() {
  const { open } = useModal();
  const accounts = useAccounts();
  const solanaAccount = accounts?.find((a) => a.addressType === 'Solana');

  if (solanaAccount) {
    const addr = solanaAccount.address;
    return (
      <button className="px-4 py-2 bg-zinc-800 rounded-lg text-sm font-mono">
        {addr.slice(0, 4)}...{addr.slice(-4)}
      </button>
    );
  }

  return (
    <button
      onClick={() => open()}
      className="px-4 py-2 bg-[var(--accent)] text-black rounded-lg text-sm font-semibold hover:brightness-110"
    >
      Connect Wallet
    </button>
  );
}
