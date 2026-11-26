import type { CollectionConfig } from 'payload';

import { shushLexicalEditor } from '../fields/shushLexicalEditor';
import { mediaBlurDataURLField } from '../fields/mediaBlurField';
import { generateBlurDataURL } from '../hooks/generateBlurDataURL';
import { getMediaRoot } from '../paths';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
  },
  upload: {
    staticDir: getMediaRoot(),
  },
  hooks: {
    beforeChange: [generateBlurDataURL],
  },
  access: {
    read: () => true,
  },
  fields: [
    mediaBlurDataURLField,
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