'use client';

import { ReactNode } from 'react';
import { CartProvider as USCProvider } from 'use-shopping-cart';

export default function CartProvider({ children }: { children: ReactNode }) {
  return (
    <USCProvider
      mode='payment'
      cartMode='client-only'
      stripe={process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY as string}
      successUrl={`${process.env.NEXT_PUBLIC_SERVER_URL}/success`}
      cancelUrl={`${process.env.NEXT_PUBLIC_SERVER_URL}`}
      currency='EUR'
      billingAddressCollection={true}
      shouldPersist={true}
      // allowedCountries={['DE']}
    >
      {children}
    </USCProvider>
  );
}
