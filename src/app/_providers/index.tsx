'use client';

import React from 'react';

import { AuthProvider } from '../_providers/Auth';
import { ThemeProvider } from './Theme';
import CartProvider from './CartProvider';
export const Providers: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <CartProvider>
      <ThemeProvider>{children}</ThemeProvider>
    </CartProvider>
  );
};
