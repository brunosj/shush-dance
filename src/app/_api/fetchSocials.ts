import type { Social } from '../../payload/payload-types';

import { getLocalPayload } from './localPayload';

export const fetchSocials = async (): Promise<Social> => {
  const payload = await getLocalPayload();
  return (await payload.findGlobal({
    slug: 'socials',
    depth: 2,
  })) as Social;
};