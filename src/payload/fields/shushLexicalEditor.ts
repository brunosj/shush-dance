import {
  FixedToolbarFeature,
  InlineToolbarFeature,
  lexicalEditor,
  LinkFeature,
} from '@payloadcms/richtext-lexical';
import {
  defaultSlateConverters,
  SlateToLexicalFeature,
} from '@payloadcms/richtext-lexical/migrate';

import { SlateButtonConverter } from './slateButtonConverter';

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
    // Converters for `migrateSlateToLexical`. Hooks stay off so the script's
    // writes do not convert the same field again on the way out.
    SlateToLexicalFeature({
      disableHooks: true,
      converters: [...defaultSlateConverters, SlateButtonConverter],
    }),
  ],
});