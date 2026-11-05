'use client';

import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import React from 'react';

import CartProvider from './CartProvider';
import { CheckoutProvider } from './CheckoutProvider';
import { ShippingProvider } from './ShippingProvider';
import { ThemeProvider } from './Theme';

export const Providers: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
    currency: 'EUR',
    disableFunding: 'card,credit,sepa',
  };

  return (
    <CartProvider>
      <ShippingProvider>
        <CheckoutProvider>
          <PayPalScriptProvider options={initialOptions}>
            <ThemeProvider>{children}</ThemeProvider>
          </PayPalScriptProvider>
        </CheckoutProvider>
      </ShippingProvider>
    </CartProvider>
  );
};
