'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import WalletButton from '@/components/shared/WalletButton';

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/agents',    label: 'Agents' },
  { href: '/deploy',    label: 'Deploy Agent' },
  { href: '/proof',     label: 'Proof' },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(9,9,11,0.88)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 56, gap: 24 }}>

          {/* Logo */}
          <Link
            href="/"
            style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <span
              className="x9-mono"
              style={{
                fontSize: 15,
                fontWeight: 700,
                color: 'var(--color-x9-text)',
                letterSpacing: '-0.02em',
              }}
            >
              x9<span style={{ color: 'var(--color-x9-accent)' }}>.</span>protocol
            </span>
            <span className="x9-badge x9-badge--green" style={{ fontSize: 10, padding: '2px 6px' }}>
              BETA
            </span>
          </Link>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
            {NAV_LINKS.map(({ href, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  style={{
                    fontSize: 14,
                    color: isActive ? 'var(--color-x9-text)' : 'var(--color-x9-text-muted)',
                    fontWeight: isActive ? 500 : 400,
                    textDecoration: 'none',
                    transition: 'color 150ms ease',
                  }}
                >
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Right — wallet */}
          <WalletButton />

        </div>
      </div>
    </header>
  );
}
