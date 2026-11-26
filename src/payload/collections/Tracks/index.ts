import { CollectionConfig } from 'payload';

import audioField from '../../fields/audioField';
import afterChangeHook from '../../hooks/afterChangeHook';

const Tracks: CollectionConfig = {
  slug: 'tracks',
  labels: {
    singular: 'Track',
    plural: 'Tracks',
  },
  access: {
    read: () => true,
    update: () => true,
  },
  admin: {
    group: 'Music',
    defaultColumns: ['title', 'artist', 'release', 'updatedAt'],
    useAsTitle: 'title',
  },
  hooks: {
    afterChange: [afterChangeHook],
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          fields: [
            {
              name: 'title',
              type: 'text',
              required: false,
            },
            {
              name: 'artist',
              type: 'relationship',
              relationTo: 'artists',
              label: 'Artist',
              required: true,
              admin: {
                allowCreate: true,
                description:
                  'Search existing artists, or click + to create one here (name is enough).',
              },
            },
            {
              name: 'release',
              type: 'relationship',
              relationTo: 'releases',
              label: 'Release',
              hasMany: false,
            },
            {
              name: 'description',
              type: 'textarea',
              required: false,
            },
          ],
        },
        {
          label: 'Audio',
          fields: [
            {
              type: 'group',
              name: 'audioGroup',
              label: 'Audio File',
              fields: [
                audioField,
                {
                  name: 'audioHighQuality',
                  label: 'Audio File (AIFF)',
                  type: 'relationship',
                  relationTo: 'audio',
                  admin: {
                    description: 'Master / high-quality file (AIFF)',
                  },
                },
                {
                  name: 'audioUpload',
                  label: 'Audio File (MP3)',
                  type: 'relationship',
                  relationTo: 'audio',
                  admin: {
                    description:
                      'Preview MP3. Refresh the page after uploading a new audio file to see player changes.',
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

export default Tracks;