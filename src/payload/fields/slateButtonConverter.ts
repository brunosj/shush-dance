export const SlateButtonConverter = {
  converter({ slateNode }) {
    const firstChild = slateNode.children?.[0] as { text?: string } | undefined;
    const label =
      (typeof slateNode.label === 'string' && slateNode.label) ||
      firstChild?.text ||
      'Button';

    const linkType =
      (slateNode.linkType as 'custom' | 'internal' | undefined) || 'custom';

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
        linkType,
        doc: slateNode.doc || null,
        newTab: Boolean(slateNode.newTab),
        url: linkType === 'custom' ? slateNode.url || 'https' : undefined,
        appearance: 'button',
      },
      format: '',
      indent: 0,
      version: 2,
    };
  },
  nodeTypes: ['button'],
};