import type { CollectionConfig } from 'payload/types';
import { createRichTextField } from '../../fields/createRichTextField';
import { slugField } from '../../fields/slug';
import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';

export const Releases: CollectionConfig = {
  slug: 'releases',
  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'artist',
      'catalogNumber',
      'releaseYear',
      'updatedAt',
    ],
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
      label: 'Release Title',
      required: true,
    },
    {
      name: 'tracks',
      type: 'relationship',
      relationTo: 'tracks',
      label: 'Tracks',
      hasMany: true,
    },
    {
      name: 'artist',
      type: 'relationship',
      relationTo: 'artists',
      label: 'Artist',
      required: true,
    },

    createRichTextField({
      label: 'Description',
    }),
    createRichTextField({
      label: 'Credits',
    }),
    {
      name: 'buyLink',
      type: 'text',
      label: 'Buy Link',
      required: false,
    },
    {
      name: 'artwork',
      type: 'upload',
      relationTo: 'media',
      label: 'Artwork',
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
          required: true,
        },
      ],
    },
    {
      name: 'catalogNumber',
      type: 'text',
      label: 'Catalog Number',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'releaseYear',
      type: 'number',
      label: 'Release Year',
      required: true,
      admin: {
        position: 'sidebar',
      },
    },
    slugField('title'),
  ],
};
