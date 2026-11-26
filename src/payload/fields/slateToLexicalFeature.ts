import { SlateToLexicalFeature } from '@payloadcms/richtext-lexical/migrate';

import { SlateButtonConverter } from './slateButtonConverter';

export const slateToLexicalMigrationFeature = SlateToLexicalFeature({
  converters: ({ defaultConverters }) => [
    ...defaultConverters,
    SlateButtonConverter,
  ],
});