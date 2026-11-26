import type { Merch } from '../../payload/payload-types';

import { getLocalPayload } from './localPayload';

export const fetchMerch = async (): Promise<Merch[]> => {
  const payload = await getLocalPayload();
  const merchRes = await payload.find({
    collection: 'merch',
    depth: 2,
    limit: 0,
    pagination: false,
    where: {
      _status: {
        equals: 'published',
      },
    },
  });

  return (merchRes.docs ?? []) as Merch[];
};