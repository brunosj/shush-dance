import type { MetadataRoute } from 'next';

import { getSiteUrl, isSiteLiveForSeo } from '../_utilities/siteUrl';

export default function robots(): MetadataRoute.Robots {
  if (!isSiteLiveForSeo()) {
    return {
      rules: {
        userAgent: '*',
        disallow: '/',
      },
    };
  }

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api/', '/next/', '/dashboard', '/tracker/'],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}