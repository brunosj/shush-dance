import type { Release } from '../../payload/payload-types';

import { getLocalPayload } from './localPayload';

export const fetchReleases = async (): Promise<Release[]> => {
  const payload = await getLocalPayload();
  const releasesRes = await payload.find({
    collection: 'releases',
    depth: 2,
    limit: 0,
    pagination: false,
    where: {
      _status: {
        equals: 'published',
      },
    },
  });

  return (releasesRes.docs ?? []) as Release[];
};