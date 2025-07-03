import React from 'react';
import type { Viewport } from 'next';
import localFont from 'next/font/local';
import { Metadata } from 'next';
import { Providers } from './_providers';
import { InitTheme } from './_providers/Theme/InitTheme';
import { siteMetadata } from './_components/Metadata';
import { Header } from './_components/Header';
import { Footer } from './_components/Footer/footer';
import { Toaster } from 'react-hot-toast';

import './_css/globals.css';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

const EditorialRegular = localFont({
  src: '../app/_fonts/EditorialNew-Regular.otf',
  display: 'swap',
  variable: '--editorial',
  weight: '1 1000',
});

const RobotoMono = localFont({
  src: '../app/_fonts/RobotoMono-VariableFont_wght.ttf',
  display: 'swap',
  variable: '--editorial',
  weight: '1 1000',
});

export const metadata: Metadata = {
  ...siteMetadata,
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang='en'
      suppressHydrationWarning
      className={`${RobotoMono.className}`}
    >
      <head>
        <InitTheme />
        <link rel='icon' href='/favicon.ico' sizes='32x32' />
        <link rel='icon' href='/favicon.svg' type='image/svg+xml' />
      </head>
      <body>
        <Providers>
          <Toaster
            position='top-right'
            toastOptions={{
              success: {
                iconTheme: {
                  primary: '#000000',
                  secondary: '#FEFEF6',
                },
              },
            }}
          />
          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
