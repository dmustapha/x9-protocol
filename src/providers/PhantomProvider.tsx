'use client';

import { AddressType } from '@phantom/react-sdk';
import { ReactNode, Suspense } from 'react';
import dynamic from 'next/dynamic';

const PhantomSDKProvider = dynamic(
  () => import('@phantom/react-sdk').then((m) => m.PhantomProvider),
  { ssr: false }
);

export default function PhantomProvider({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <PhantomSDKProvider
        config={{
          appId: process.env.NEXT_PUBLIC_PHANTOM_APP_ID || 'x9-protocol',
          providers: ['injected', 'deeplink'],
          addressTypes: ['Solana' as AddressType],
        }}
      >
        {children}
      </PhantomSDKProvider>
    </Suspense>
  );
}
