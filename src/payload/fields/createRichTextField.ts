import type { RichTextField } from 'payload/dist/fields/config/types';

import { slateEditor } from '@payloadcms/richtext-slate';
import link from './link';

type RichTextFieldOptions = {
  label: string;
};

export const createRichTextField = ({
  label,
}: RichTextFieldOptions): RichTextField => ({
  name: label.toLowerCase().replace(/\s+/g, '_'),
  type: 'richText',
  label: label,
  localized: true,
  required: false,
  editor: slateEditor({
    admin: {
      elements: ['h1', 'h2', 'h3', 'h4', 'link', 'blockquote', 'ol', 'ul'],
      leaves: ['bold', 'italic'],
      link: {
        fields: [
          link({
            overrides: {
              admin: {
                condition: (_, { addLink }) => Boolean(addLink),
              },
            },
          }),
        ],
      },
    },
  }),
});
