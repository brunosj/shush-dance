import { RichTextButtonElement } from './Element';
import withRichTextButton from './plugin';
import { RichTextButtonToolbar } from './ToolbarButton';

export const richTextButtonElement = {
  name: 'button',
  Button: RichTextButtonToolbar,
  Element: RichTextButtonElement,
  plugins: [withRichTextButton],
};
