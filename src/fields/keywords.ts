import type { Field } from 'payload/types';

export const keywordsField: Field = {
  name: 'keywords',
  type: 'text',
  label: {
    en: 'Keywords',
    de: 'Stichwörter',
  },
  localized: true,
  // required: true,
  admin: {
    placeholder: { en: 'Enter keywords', de: 'Stichwörter eingeben' },
  },
};
