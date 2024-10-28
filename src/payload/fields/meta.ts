import type { Field } from 'payload/types';

import { descriptionField } from './description';
import { titleField } from './title';
import { keywordsField } from './keywords';

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
