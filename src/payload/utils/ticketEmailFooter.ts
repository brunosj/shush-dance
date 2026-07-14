import escapeHTML from 'escape-html';
import { Text } from 'slate';

type SlateNode = {
  type?: string;
  text?: string;
  bold?: boolean;
  italic?: boolean;
  url?: string;
  children?: SlateNode[];
  [key: string]: unknown;
};

function escapeAndFormatText(text: string): string {
  return escapeHTML(text).replace(/\r\n/g, '\n').replace(/\n/g, '<br/>');
}

function isEmptyBlock(node: SlateNode): boolean {
  if (!node.children?.length) return true;

  return node.children.every((child) => {
    if (Text.isText(child)) {
      return !(child.text || '').trim();
    }

    return isEmptyBlock(child);
  });
}

function wrapEmailBlock(tag: string, style: string, inner: string): string {
  if (!inner.trim()) {
    return '<br/>';
  }

  return `<${tag} style="${style}">${inner}</${tag}>`;
}

const blockStyles: Record<string, string> = {
  h1: 'margin: 16px 0 8px; font-size: 24px; font-weight: bold; line-height: 1.3; display: block;',
  h2: 'margin: 16px 0 8px; font-size: 20px; font-weight: bold; line-height: 1.3; display: block;',
  h3: 'margin: 14px 0 6px; font-size: 18px; font-weight: bold; line-height: 1.3; display: block;',
  h4: 'margin: 12px 0 6px; font-size: 16px; font-weight: bold; line-height: 1.3; display: block;',
  h5: 'margin: 10px 0 4px; font-size: 14px; font-weight: bold; line-height: 1.3; display: block;',
  h6: 'margin: 10px 0 4px; font-size: 13px; font-weight: bold; line-height: 1.3; display: block;',
  p: 'margin: 0 0 14px; font-size: 14px; line-height: 1.5; display: block;',
  ul: 'margin: 0 0 14px 20px; padding: 0; font-size: 14px; line-height: 1.5; display: block;',
  ol: 'margin: 0 0 14px 20px; padding: 0; font-size: 14px; line-height: 1.5; display: block;',
  li: 'margin: 0 0 4px; display: list-item;',
  blockquote:
    'margin: 0 0 14px; padding: 8px 16px; border-left: 3px solid #ccc; font-size: 14px; line-height: 1.5; color: #444; display: block;',
};

function serializeNodes(children: SlateNode[] | null | undefined): string {
  if (!children || children.length === 0) {
    return '';
  }

  return children
    .map((node) => {
      if (Text.isText(node)) {
        let text = escapeAndFormatText(node.text || '');

        if (node.bold) {
          text = `<strong>${text}</strong>`;
        }

        if (node.italic) {
          text = `<em>${text}</em>`;
        }

        return text;
      }

      if (!node) {
        return '';
      }

      if (isEmptyBlock(node)) {
        return '<br/>';
      }

      const inner = serializeNodes(node.children);

      switch (node.type) {
        case 'h1':
        case 'h2':
        case 'h3':
        case 'h4':
        case 'h5':
        case 'h6':
          return wrapEmailBlock(node.type, blockStyles[node.type], inner);
        case 'blockquote':
          return wrapEmailBlock('blockquote', blockStyles.blockquote, inner);
        case 'ul':
          return wrapEmailBlock('ul', blockStyles.ul, inner);
        case 'ol':
          return wrapEmailBlock('ol', blockStyles.ol, inner);
        case 'li':
          return wrapEmailBlock('li', blockStyles.li, inner);
        case 'link':
          return `<a href="${escapeHTML(node.url || '')}" style="color: #000; text-decoration: underline;" target="_blank" rel="noopener noreferrer">${inner}</a>`;
        default:
          return wrapEmailBlock('p', blockStyles.p, inner);
      }
    })
    .join('');
}

export function serializeRichTextToHtml(
  content: SlateNode[] | null | undefined
): string {
  if (!content || content.length === 0) {
    return '';
  }

  return serializeNodes(content).trim();
}

export function renderEventFooterSection(eventFooterHtml: string): string {
  if (!eventFooterHtml) {
    return '';
  }

  return `
    <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;" />
    <h3 style="text-transform: uppercase; letter-spacing: 0.05em; font-size: 14px; margin: 0 0 12px;">Event Information</h3>
    ${eventFooterHtml}
  `;
}

export async function fetchEventFooterHtml(
  req: { payload: { findByID: (args: unknown) => Promise<unknown> } },
  eventId: string | null | undefined
): Promise<string> {
  if (!eventId) {
    return '';
  }

  try {
    const event = (await req.payload.findByID({
      collection: 'events',
      id: eventId,
      depth: 0,
    })) as { ticket_email_footer?: SlateNode[] | null };

    if (!event?.ticket_email_footer) {
      return '';
    }

    return serializeRichTextToHtml(event.ticket_email_footer);
  } catch {
    return '';
  }
}
