import type { MetadataRoute } from 'next';

import { fetchPages } from '../_api/fetchPages';
import { getSiteUrl, isSiteLiveForSeo } from '../_utilities/siteUrl';

const EXCLUDED_SLUGS = new Set(['dashboard', 'tracker']);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isSiteLiveForSeo()) {
    return [];
  }

  const siteUrl = getSiteUrl();
  const pages = await fetchPages();
  const entries: MetadataRoute.Sitemap = [];

  for (const page of pages) {
    if (!page.slug || EXCLUDED_SLUGS.has(page.slug)) {
      continue;
    }

    const path = page.slug === 'home' ? '' : `/${page.slug}`;
    entries.push({
      url: `${siteUrl}${path}`,
      lastModified: page.updatedAt ? new Date(page.updatedAt) : undefined,
    });
  }

  return entries;
}