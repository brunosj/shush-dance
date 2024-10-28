import type { Field } from 'payload/types';

export const descriptionField: Field = {
  name: 'description',
  type: 'text',
  label: {
    en: 'Description',
    de: 'Beschreibung',
  },
  // required: true,
  localized: true,
  admin: {
    placeholder: { en: 'Enter description', de: 'Beschreibung eingeben' },
  },
};
