import type { Release } from '../../payload/payload-types';

import { CACHE_TAGS } from './cacheTags';
import { cached } from './cached';
import { getLocalPayload } from './localPayload';

async function queryReleases(options?: {
  limit?: number;
}): Promise<Release[]> {
  const payload = await getLocalPayload();
  const limit = options?.limit;
  const releasesRes = await payload.find({
    collection: 'releases',
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

  return (releasesRes.docs ?? []) as Release[];
}

export const fetchReleases = async (options?: {
  limit?: number;
  draft?: boolean;
}): Promise<Release[]> => {
  if (options?.draft) {
    return queryReleases(options);
  }

  const key = options?.limit ? `releases-limit-${options.limit}` : 'releases-all';
  return cached(() => queryReleases(options), [key], {
    tags: [CACHE_TAGS.site, CACHE_TAGS.releases],
  })();
};
