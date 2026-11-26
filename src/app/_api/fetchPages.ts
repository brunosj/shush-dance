import type { Page } from '../../payload/payload-types';

import { getLocalPayload } from './localPayload';

export const fetchPages = async (): Promise<Page[]> => {
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
};