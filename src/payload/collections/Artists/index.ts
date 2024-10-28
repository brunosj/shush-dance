import type { CollectionConfig } from 'payload/types';
import { slugField } from '../../fields/slug';
import { createRichTextField } from '../../fields/createRichTextField';
import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';

export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    useAsTitle: 'artistName',
    defaultColumns: ['artistName', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    // Artist Field
    {
      name: 'artistName',
      type: 'text',
      label: 'Artist Name',
      required: true,
    },
    // Summary Field
    createRichTextField({
      label: 'Artist Bio',
    }),

    // Image Field
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Artist Image',
      required: false,
    },
    // Slug Field
    slugField('artistName'),
  ],
};
