import { GlobalConfig } from 'payload';

export const Settings: GlobalConfig = {
  slug: 'settings',
  admin: {
    group: 'Admin',
  },
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
