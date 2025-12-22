import { slateEditor } from '@payloadcms/richtext-slate';
import path from 'path';
import type { CollectionConfig } from 'payload/types';

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticURL: '/media',
    // In production: /home/lando/media (6 levels up from dist/payload/collections/)
    staticDir:
      process.env.MEDIA_DIR ||
      path.resolve(__dirname, '../../../../../../media'),
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'caption',
      type: 'richText',
      editor: slateEditor({
        admin: {
          elements: ['link'],
        },
      }),
    },
  ],
};
