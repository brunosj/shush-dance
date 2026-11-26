import { SlateLinkConverter } from '@payloadcms/richtext-lexical/migrate';

/**
 * Old Slate `button` elements become Lexical links with `appearance: 'button'`.
 * Typed via `SlateLinkConverter` — `SlateNodeConverter` is not re-exported from `/migrate`.
 */
export const SlateButtonConverter: typeof SlateLinkConverter = {
  nodeTypes: ['button'],
  converter({ slateNode }) {
    const label =
      typeof slateNode.label === 'string' && slateNode.label.trim()
        ? slateNode.label.trim()
        : 'Button';

    return {
      type: 'link',
      children: [
        {
          type: 'text',
          detail: 0,
          format: 0,
          mode: 'normal',
          style: '',
          text: label,
          version: 1,
        },
      ],
      direction: 'ltr',
      fields: {
        appearance: 'button',
        doc: slateNode.doc || null,
        linkType: slateNode.linkType || 'custom',
        newTab: Boolean(slateNode.newTab),
        url:
          (slateNode.linkType || 'custom') === 'custom'
            ? slateNode.url || ''
            : undefined,
      },
      format: '',
      indent: 0,
      version: 2,
    };
  },
};