import type { Field } from 'payload/types';

import { descriptionField } from './description';
import { keywordsField } from './keywords';
import { titleField } from './title';

export const meta: Field = {
  name: 'meta',
  label: {
    en: 'Meta Info (SEO)',
    de: 'Meta-Informationen (SEO)',
  },
  type: 'group',
  fields: [titleField, descriptionField, keywordsField],
  // admin: {
  //   position: 'sidebar',
  // },
};
