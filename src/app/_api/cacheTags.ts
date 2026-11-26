export const CACHE_TAGS = {
  /** Every public Payload read. Bust this when catalog/media can appear on any page. */
  site: 'site',
  pages: 'pages',
  page: (slug: string) => `pages:${slug}` as const,
  events: 'events',
  releases: 'releases',
  merch: 'merch',
  socials: 'socials',
  sitemap: 'sitemap',
} as const;