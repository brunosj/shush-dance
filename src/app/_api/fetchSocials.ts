import type { Social } from '../../payload/payload-types';

import { CACHE_TAGS } from './cacheTags';
import { cached } from './cached';
import { getLocalPayload } from './localPayload';

async function querySocials(): Promise<Social> {
  const payload = await getLocalPayload();
  return (await payload.findGlobal({
    slug: 'socials',
    depth: 1,
  })) as Social;
}

export const fetchSocials = async (options?: {
  draft?: boolean;
}): Promise<Social> => {
  if (options?.draft) {
    return querySocials();
  }

  return cached(querySocials, ['socials'], {
    tags: [CACHE_TAGS.site, CACHE_TAGS.socials],
  })();
};
