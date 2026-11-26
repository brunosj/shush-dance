import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
} from '@payloadcms/richtext-lexical';

import { slateToLexicalMigrationFeature } from './slateToLexicalFeature';

/**
 * Shared Lexical editor: default formatting tools, a fixed top toolbar,
 * and the button/link appearance used by existing content.
 */
export const shushLexicalEditor = lexicalEditor({
  features: ({ defaultFeatures }) => [
    ...defaultFeatures.filter((feature) => feature.key !== 'link'),
    LinkFeature({
      enabledCollections: ['pages', 'documents'],
      fields: ({ defaultFields }) => [
        ...defaultFields,
        {
          name: 'appearance',
          type: 'select',
          defaultValue: 'link',
          options: [
            { label: 'Link', value: 'link' },
            { label: 'Button', value: 'button' },
          ],
        },
      ],
    }),
    InlineToolbarFeature(),
    FixedToolbarFeature(),
    slateToLexicalMigrationFeature,
  ],
});
