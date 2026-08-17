import type { GlobalConfig } from 'payload/types';

import link from '../fields/link';

export const Socials: GlobalConfig = {
  slug: 'socials',
  admin: {
    group: 'Admin',
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
