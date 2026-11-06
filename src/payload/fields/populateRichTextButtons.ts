import type { PayloadRequest } from 'payload/types';

type RichTextNode = {
  type?: string;
  doc?: {
    relationTo?: string;
    value?: unknown;
  };
  children?: RichTextNode[];
  [key: string]: unknown;
};

function relationId(value: unknown): string | null {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id?: unknown }).id;
    if (typeof id === 'string' || typeof id === 'number') return String(id);
  }
  return null;
}

function isPopulatedDoc(value: unknown): boolean {
  return Boolean(
    value &&
      typeof value === 'object' &&
      ('slug' in value || 'url' in value || 'filename' in value),
  );
}

/**
 * Payload's Slate population only walks `link` / `upload` / `relationship`.
 * Custom `button` nodes with an internal `doc` stay as bare IDs unless we
 * populate them here — otherwise the frontend gets an empty href and renders
 * a disabled button.
 */
export async function populateRichTextButtons(
  nodes: unknown,
  req: PayloadRequest,
): Promise<void> {
  if (!Array.isArray(nodes)) return;

  const walk = async (children: RichTextNode[]): Promise<void> => {
    for (const element of children) {
      if (
        element?.type === 'button' &&
        element.doc?.relationTo &&
        element.doc.value != null &&
        !isPopulatedDoc(element.doc.value)
      ) {
        const id = relationId(element.doc.value);
        const collection = element.doc.relationTo;
        if (id && req.payload.collections?.[collection]) {
          try {
            element.doc.value = await req.payload.findByID({
              collection: collection as 'pages' | 'documents' | 'media',
              id,
              depth: 0,
              req,
              overrideAccess: false,
            });
          } catch {
            // Leave the raw id; frontend will treat missing href as disabled.
          }
        }
      }

      if (Array.isArray(element?.children)) {
        await walk(element.children);
      }
    }
  };

  await walk(nodes as RichTextNode[]);
}
