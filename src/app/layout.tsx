import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PhantomProvider from '@/providers/PhantomProvider';
import Header from '@/components/layout/Header';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'x9 protocol: AI judgment. Onchain enforcement.',
  description: 'Deploy autonomous AI trading agents on Solana with cryptographic policy enforcement via Swig.',
  icons: {
    icon: '/favicon.svg',
    shortcut: '/favicon.svg',
  },
  openGraph: {
    title: 'x9 protocol: AI judgment. Onchain enforcement.',
    description: 'Deploy autonomous AI trading agents on Solana with cryptographic policy enforcement via Swig.',
    type: 'website',
    images: [{ url: '/logo.png', width: 1400, height: 600, alt: 'x9 protocol' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'x9 protocol — AI judgment. Onchain enforcement.',
    description: 'Autonomous trading agents. Cryptographic policy. Solana.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} x9-bg x9-text x9-font-sans antialiased`}>
        <PhantomProvider>
          <Header />
          <main>{children}</main>
        </PhantomProvider>
      </body>
    </html>
  );
}
