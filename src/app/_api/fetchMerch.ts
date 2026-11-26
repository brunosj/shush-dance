import type { Merch } from '../../payload/payload-types';

import { CACHE_TAGS } from './cacheTags';
import { cached } from './cached';
import { getLocalPayload } from './localPayload';

async function queryMerch(options?: { limit?: number }): Promise<Merch[]> {
  const payload = await getLocalPayload();
  const limit = options?.limit;
  const merchRes = await payload.find({
    collection: 'merch',
    depth: 1,
    limit: limit && limit > 0 ? limit : 0,
    pagination: false,
    sort: '-releaseDate',
    where: {
      _status: {
        equals: 'published',
      },
    },
  });

  return (merchRes.docs ?? []) as Merch[];
}

export const fetchMerch = async (options?: {
  limit?: number;
  draft?: boolean;
}): Promise<Merch[]> => {
  if (options?.draft) {
    return queryMerch(options);
  }

  const key = options?.limit ? `merch-limit-${options.limit}` : 'merch-all';
  return cached(() => queryMerch(options), [key], {
    tags: [CACHE_TAGS.site, CACHE_TAGS.merch],
  })();
};
