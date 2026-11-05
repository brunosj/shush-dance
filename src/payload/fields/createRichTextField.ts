import { slateEditor } from '@payloadcms/richtext-slate';
import type { RichTextField } from 'payload/dist/fields/config/types';

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
