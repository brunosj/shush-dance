import type { Page } from '../../payload/payload-types';

import { CACHE_TAGS } from './cacheTags';
import { cached } from './cached';
import { getLocalPayload } from './localPayload';

async function queryPages(): Promise<Page[]> {
  const payload = await getLocalPayload();
  const pageRes = await payload.find({
    collection: 'pages',
    depth: 0,
    limit: 100,
    pagination: false,
    where: {
      _status: { equals: 'published' },
    },
  });

  return (pageRes.docs ?? []) as Page[];
}

export const fetchPages = async (): Promise<Page[]> => {
  return cached(queryPages, ['pages-list'], {
    tags: [CACHE_TAGS.site, CACHE_TAGS.pages, CACHE_TAGS.sitemap],
  })();
};
