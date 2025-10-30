import { GlobalConfig } from 'payload/types';

export const Settings: GlobalConfig = {
  slug: 'settings',
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'lastBandcampSync',
      type: 'date',
      admin: {
        description: 'Last successful Bandcamp sync timestamp',
      },
    },
  ],
};
