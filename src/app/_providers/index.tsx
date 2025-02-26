'use client';

import React from 'react';
import { PayPalScriptProvider } from '@paypal/react-paypal-js';
import { AuthProvider } from '../_providers/Auth';
import { ThemeProvider } from './Theme';
import CartProvider from './CartProvider';
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
      <PayPalScriptProvider options={initialOptions}>
        <ThemeProvider>{children}</ThemeProvider>
      </PayPalScriptProvider>
    </CartProvider>
  );
};
