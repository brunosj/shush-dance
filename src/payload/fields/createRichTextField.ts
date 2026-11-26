import type { RichTextField } from 'payload';

import { shushLexicalEditor } from './shushLexicalEditor';

type RichTextFieldOptions = {
  label: string;
};

export const createRichTextField = ({
  label,
}: RichTextFieldOptions): RichTextField => ({
  name: label.toLowerCase().replace(/\s+/g, '_'),
  type: 'richText',
  label,
  required: false,
  editor: shushLexicalEditor,
});