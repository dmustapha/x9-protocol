'use client';

import { PhantomProvider as PhantomSDKProvider, AddressType } from '@phantom/react-sdk';
import { ReactNode } from 'react';

export default function PhantomProvider({ children }: { children: ReactNode }) {
  return (
    <PhantomSDKProvider
      config={{
        appId: process.env.NEXT_PUBLIC_PHANTOM_APP_ID || 'x9-protocol',
        providers: ['injected', 'deeplink'],
        addressTypes: ['Solana' as AddressType],
      }}
    >
      {children}
    </PhantomSDKProvider>
  );
}
