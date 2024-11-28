import type { CollectionConfig } from 'payload/types';
import { createRichTextField } from '../../fields/createRichTextField';
import { slugField } from '../../fields/slug';
import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';

export const Merch: CollectionConfig = {
  slug: 'merch',
  labels: {
    singular: 'Merch Item',
    plural: 'Merch Items',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'itemType', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: adminsOrPublished,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'Title',
      required: true,
    },
    {
      name: 'itemType',
      type: 'text',
      label: 'Item Type',
      required: true,
    },
    createRichTextField({
      label: 'Description',
    }),
    {
      name: 'buyLink',
      type: 'text',
      label: 'Buy Link',
      required: false,
    },
    {
      name: 'mainImage',
      type: 'upload',
      relationTo: 'media',
      label: 'Main Image',
      required: true,
    },
    {
      name: 'images',
      type: 'array',
      label: 'Images',
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          label: 'Image',
          required: false,
        },
      ],
    },
    slugField('title'),
  ],
};
