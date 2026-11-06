import { slateEditor } from '@payloadcms/richtext-slate';
import type { RichTextField } from 'payload/dist/fields/config/types';

import { populateRichTextButtons } from './populateRichTextButtons';
import { richTextButtonElement } from './richTextButton';
import { restrictRichTextLinkDrawerFields } from './richTextLinkFields';

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
  hooks: {
    afterRead: [
      async ({ value, req }) => {
        if (Array.isArray(value)) {
          await populateRichTextButtons(value, req);
        }
        return value;
      },
    ],
  },
  editor: slateEditor({
    admin: {
      elements: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'link',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        richTextButtonElement as any,
        'blockquote',
        'ol',
        'ul',
      ],
      leaves: ['bold', 'italic'],
      link: {
        fields: ({ defaultFields }) =>
          restrictRichTextLinkDrawerFields(defaultFields),
      },
    },
  }),
});
