import { draftMode } from 'next/headers';

import type { Page } from '../../payload/payload-types';

import { getLocalPayload } from './localPayload';

export const fetchPage = async (
  slug: string,
): Promise<Page | undefined | null> => {
  const { isEnabled: draft } = await draftMode();
  const payload = await getLocalPayload();
  const pageRes = await payload.find({
    collection: 'pages',
    depth: 2,
    limit: 1,
    draft,
    overrideAccess: draft,
    where: {
      and: [
        { slug: { equals: slug } },
        ...(draft ? [] : [{ _status: { equals: 'published' } }]),
      ],
    },
  });

  return (pageRes.docs[0] ?? null) as Page | null;
};