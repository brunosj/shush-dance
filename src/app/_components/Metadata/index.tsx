import { Metadata } from 'next';

const siteMetadata: Metadata = {
  metadataBase: new URL('https://shush.dance'),
  title: 'SHUSH',
  description: 'unity through movement and vibration',

  // Basic metadata
  applicationName: 'SHUSH',
  authors: [{ name: 'Bruno SJ', url: 'https://landozone.net' }],
  keywords: ['dance', 'berlin', 'underground'],
  referrer: 'origin-when-cross-origin',
  creator: 'landozone',
  publisher: 'SHUSH',

  // Open Graph metadata
  openGraph: {
    title: 'SHUSH',
    description: 'unity through movement and vibration',
    url: 'https://shush.dance',
    siteName: 'SHUSH',
    images: [
      {
        url: 'https://shush.dance/shush_logo_cream_v2.jpg',
        width: 1200,
        height: 630,
        alt: 'SHUSH Image',
      },
    ],
    locale: 'en_US, de_DE',
    type: 'website',
  },

  // Twitter metadata
  twitter: {
    card: 'summary_large_image',
    title: 'SHUSH',
    description: 'unity through movement and vibration',
    images: ['https://shush.dance/shush_logo_cream_v2.jpg'],
  },

  // Verification for search engines
  verification: {
    google: 'google-site-verification=your-google-verification-code',
    yandex: 'yandex-verification=your-yandex-verification-code',
    yahoo: 'yahoo-site-verification=your-yahoo-verification-code',
  },

  // Alternate languages
  alternates: {
    canonical: 'https://shush.dance',
    languages: {
      'en-US': 'https://shush.dance/',
    },
  },

  // Icons
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.icon',
    // apple: '/apple-touch-icon.png',
    // other: [
    //   {
    //     rel: 'apple-touch-icon-precomposed',
    //     url: '/apple-touch-icon-precomposed.png',
    //   },
    // ],
  },

  // Manifest
  manifest: '/site.webmanifest',

  // App-specific metadata
  appleWebApp: {
    capable: false,
    title: 'SHUSH',
    statusBarStyle: 'black-translucent',
  },

  // Robots directives
  robots: {
    index: true,
    follow: true,
    nocache: true,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // Format detection
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

const MetadataComponent = () => {
  return null;
};

export default MetadataComponent;
export { siteMetadata };
