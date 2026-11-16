import type { Block } from 'payload/types';

/**
 * Extracts an iframe src from a pasted Brevo embed snippet, or returns a bare URL as-is.
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
      localized: true,
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
      hooks: {
        beforeValidate: [
          ({ value }) => {
            const src = extractIframeSrc(value);
            return src || value;
          },
        ],
      },
      validate: (value: unknown) => {
        const src = extractIframeSrc(value);
        if (!src) {
          return 'Paste a Brevo iframe URL or embed code.';
        }

        try {
          const url = new URL(src);
          if (url.protocol !== 'https:' && url.protocol !== 'http:') {
            return 'Iframe URL must start with http:// or https://.';
          }
        } catch {
          return 'Could not parse a valid iframe URL from the value.';
        }

        return true;
      },
    },
    {
      name: 'height',
      type: 'number',
      label: 'Iframe height (px)',
      defaultValue: 500,
      min: 200,
      max: 2000,
      admin: {
        description:
          'Adjust if the form is clipped or leaves too much empty space.',
        step: 10,
      },
    },
  ],
};
