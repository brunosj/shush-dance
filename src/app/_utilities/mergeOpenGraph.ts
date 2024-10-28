import type { Metadata } from 'next';

const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  siteName: 'SHUSH',
  title: 'SHUSH',
  description: 'unity through movement and vibration',
  images: [
    {
      url: 'https://payloadcms.com/images/og-image.jpg',
    },
  ],
};

export const mergeOpenGraph = (
  og?: Metadata['openGraph']
): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  };
};
