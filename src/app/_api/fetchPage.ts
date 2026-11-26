import { draftMode } from 'next/headers';

import type { Page } from '../../payload/payload-types';

import { CACHE_TAGS } from './cacheTags';
import { cached } from './cached';
import { getLocalPayload } from './localPayload';

async function queryPage(slug: string, draft: boolean): Promise<Page | null> {
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
}

export const fetchPage = async (
  slug: string,
): Promise<Page | undefined | null> => {
  const { isEnabled: draft } = await draftMode();

  if (draft) {
    return queryPage(slug, true);
  }

  return cached(() => queryPage(slug, false), ['page', slug], {
    tags: [CACHE_TAGS.site, CACHE_TAGS.pages, CACHE_TAGS.page(slug)],
  })();
};
