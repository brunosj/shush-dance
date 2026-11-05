import type { Editor } from 'slate';

const withRichTextButton = (incomingEditor: Editor): Editor => {
  const editor = incomingEditor;
  const { isVoid } = editor;

  editor.isVoid = (element) =>
    (element as { type?: string }).type === 'button' ? true : isVoid(element);

  return editor;
};

export default withRichTextButton;
