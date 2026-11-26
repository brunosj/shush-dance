import type { GlobalConfig } from 'payload';

import link from '../fields/link';
import { revalidateSocials } from '../hooks/revalidateContent';

export const Socials: GlobalConfig = {
  slug: 'socials',
  admin: {
    group: 'Admin',
  },
  hooks: {
    afterChange: [revalidateSocials],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'items',
      type: 'array',
      maxRows: 6,
      fields: [
        link({
          appearances: false,
        }),
      ],
    },
  ],
};
