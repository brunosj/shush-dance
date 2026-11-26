import type { CollectionConfig } from 'payload';

import { shushLexicalEditor } from '../fields/shushLexicalEditor';
import { getMediaRoot } from '../paths';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  upload: {
    staticDir: getMediaRoot(),
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
      editor: shushLexicalEditor,
    },
  ],
};