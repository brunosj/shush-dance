import { SlateToLexicalFeature } from '@payloadcms/richtext-lexical/migrate';

import { SlateButtonConverter } from './slateButtonConverter';

export const slateToLexicalMigrationFeature = SlateToLexicalFeature({
  // Set before importing the Payload config. The write script must read raw
  // Slate arrays; the afterRead hook would hide them and skip the save.
  disableHooks: process.env.SLATE_TO_LEXICAL_DISABLE_HOOKS === 'true',
  converters: ({ defaultConverters }) => [
    ...defaultConverters,
    SlateButtonConverter,
  ],
});