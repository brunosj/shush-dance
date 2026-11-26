import type { CollectionConfig } from 'payload';

import { admins } from '../../access/admins';
import { createRichTextField } from '../../fields/createRichTextField';
import { slugField } from '../../fields/slug';

export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    group: 'Music',
    useAsTitle: 'artistName',
    defaultColumns: ['artistName', 'image', 'updatedAt'],
  },
  access: {
    read: () => true,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'artistName',
      type: 'text',
      label: 'Artist Name',
      required: true,
    },
    {
      type: 'collapsible',
      label: 'Artist Bio',
      admin: {
        initCollapsed: true,
      },
      fields: [
        createRichTextField({
          label: 'Artist Bio',
        }),
      ],
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Artist Image',
      required: false,
      admin: {
        position: 'sidebar',
      },
    },
    slugField('artistName'),
  ],
};