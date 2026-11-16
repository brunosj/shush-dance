import type { Block } from 'payload/types';

/**
 * Extracts an iframe src from a pasted Brevo embed snippet, or returns a bare URL as-is.
 * Used by the frontend renderer — the CMS stores the raw paste as entered.
 */
export function extractIframeSrc(value: unknown): string {
  if (typeof value !== 'string') return '';

  const trimmed = value.trim();
  if (!trimmed) return '';

  const srcMatch = trimmed.match(/src\s*=\s*["']([^"']+)["']/i);
  if (srcMatch?.[1]) {
    return srcMatch[1].trim();
  }

  return trimmed;
}

/** Pulls height="…" from a pasted Brevo iframe snippet when present. */
export function extractIframeHeight(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const match = value.match(/\bheight\s*=\s*["']?(\d+)/i);
  if (!match?.[1]) return null;

  const height = Number.parseInt(match[1], 10);
  return Number.isFinite(height) && height > 0 ? height : null;
}

export const NewsletterEmbed: Block = {
  slug: 'newsletterEmbed',
  labels: {
    singular: 'Newsletter Embed',
    plural: 'Newsletter Embeds',
  },
  interfaceName: 'NewsletterEmbedBlock',
  fields: [
    {
      name: 'heading',
      type: 'text',
      label: 'Heading',
      admin: {
        description: 'Optional heading shown above the form.',
      },
    },
    {
      name: 'iframeSrc',
      type: 'textarea',
      label: 'Brevo iframe URL or embed code',
      required: true,
      admin: {
        description:
          'From Brevo: Share → Iframe. Paste either the full iframe HTML or just the src URL (sibforms.com or my.brevo.com).',
        placeholder:
          'https://xxx.sibforms.com/serve/... or full <iframe …> snippet',
      },
    },
    {
      name: 'height',
      type: 'number',
      label: 'Iframe height (px)',
      defaultValue: 500,
      admin: {
        description:
          'Brevo iframes cannot auto-size to content. Set this tall enough to fit the full form (no scrollbar). If you pasted full embed HTML, its height attribute is used when this is empty.',
        step: 10,
      },
    },
  ],
};
