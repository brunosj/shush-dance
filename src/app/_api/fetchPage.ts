import type { Page } from '../../payload/payload-types';

import { getLocalPayload } from './localPayload';

export const fetchPage = async (
  slug: string,
): Promise<Page | undefined | null> => {
  const payload = await getLocalPayload();
  const pageRes = await payload.find({
    collection: 'pages',
    depth: 2,
    limit: 1,
    where: {
      and: [
        { slug: { equals: slug } },
        { _status: { equals: 'published' } },
      ],
    },
  });

  return (pageRes.docs[0] ?? null) as Page | null;
};