import { resolveRichTextHref } from './resolveRichTextHref';

type LexicalLinkFields = {
  linkType?: 'custom' | 'internal';
  url?: string | null;
  newTab?: boolean;
  doc?: {
    relationTo: string;
    value: unknown;
  } | null;
};

export function lexicalInternalDocToHref({
  linkNode,
}: {
  linkNode: { fields: LexicalLinkFields };
}): string {
  const { href } = resolveRichTextHref({
    linkType: linkNode.fields.linkType,
    url: linkNode.fields.url,
    newTab: linkNode.fields.newTab,
    doc: linkNode.fields.doc
      ? {
          relationTo: linkNode.fields.doc.relationTo,
          value: linkNode.fields.doc.value,
        }
      : null,
  });

  return href;
}