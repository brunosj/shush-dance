import type { Field } from 'payload/types';

export const titleField: Field = {
  name: 'title',
  type: 'text',
  label: {
    en: 'Title',
    de: 'Titel',
  },
  localized: true,
  // required: true,
  admin: {
    placeholder: { en: 'Enter title', de: 'Titel eingeben' },
    position: 'sidebar',
  },
};
