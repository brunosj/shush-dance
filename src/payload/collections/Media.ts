import type { CollectionConfig } from 'payload';

import { shushLexicalEditor } from '../fields/shushLexicalEditor';
import { mediaBlurDataURLField } from '../fields/mediaBlurField';
import { generateBlurDataURL } from '../hooks/generateBlurDataURL';
import { revalidateMedia } from '../hooks/revalidateContent';
import { getMediaRoot } from '../paths';

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    group: 'Content',
    useAsTitle: 'alt',
    defaultColumns: ['filename', 'alt', 'updatedAt'],
  },
  upload: {
    staticDir: getMediaRoot(),
    imageSizes: [
      {
        name: 'thumb',
        width: 400,
        height: undefined,
        position: 'centre',
        withoutEnlargement: true,
      },
      {
        name: 'card',
        width: 800,
        height: undefined,
        position: 'centre',
        withoutEnlargement: true,
      },
    ],
  },
  hooks: {
    beforeChange: [generateBlurDataURL],
    afterChange: [revalidateMedia],
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