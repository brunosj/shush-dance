import {
  getMediaBaseUrl,
  resolveMediaResource,
} from '../app/_utilities/getMediaUrl';

export type SlateLinkLike = {
  linkType?: 'custom' | 'internal' | null;
  url?: string | null;
  newTab?: boolean | null;
  doc?: {
    relationTo?: string | null;
    value?: unknown;
  } | null;
  label?: string | null;
};

export type ResolvedRichTextHref = {
  href: string;
  newTab: boolean;
};

export type CmsLinkShape = {
  type?: 'reference' | 'custom' | null;
  newTab?: boolean | null;
  reference?: {
    relationTo: string;
    value: unknown;
  } | null;
  url?: string | null;
  label?: string | null;
};

function resolvePageHref(value: unknown): string {
  // Unpopulated relationship (bare id) cannot be turned into a route.
  if (!value || typeof value === 'string' || typeof value === 'number') {
    return '';
  }
  const slug = (value as { slug?: string | null }).slug;
  if (!slug || slug === 'home') return '/';
  return `/${slug}`;
}

function resolveMediaHref(value: unknown): string {
  // Unpopulated relationship (bare id) cannot be turned into a file URL.
  if (!value || typeof value === 'string' || typeof value === 'number') {
    return '';
  }
  const href = resolveMediaResource(
    value as { url?: string | null; filename?: string | null },
  );
  if (href.startsWith('/') && !href.startsWith('//')) {
    const base = getMediaBaseUrl();
    return base ? `${base}${href}` : href;
  }
  return href;
}

export function resolveRichTextHref(node: SlateLinkLike): ResolvedRichTextHref {
  const linkType = node.linkType;

  if (linkType === 'internal' && node.doc?.relationTo) {
    const { relationTo, value } = node.doc;
    if (relationTo === 'pages') {
      return {
        href: resolvePageHref(value),
        newTab: Boolean(node.newTab),
      };
    }
    if (relationTo === 'documents' || relationTo === 'media') {
      return {
        href: resolveMediaHref(value),
        newTab: node.newTab !== false,
      };
    }
  }

  if (typeof node.url === 'string' && node.url.trim()) {
    return {
      href: node.url.trim(),
      newTab: Boolean(node.newTab),
    };
  }

  return { href: '', newTab: Boolean(node.newTab) };
}

export function resolveCmsLink(
  link: CmsLinkShape | null | undefined,
): ResolvedRichTextHref & { label: string } {
  if (!link) {
    return { href: '', newTab: false, label: '' };
  }

  if (link.type === 'reference' && link.reference?.relationTo) {
    const resolved = resolveRichTextHref({
      linkType: 'internal',
      doc: link.reference,
      newTab: link.newTab,
    });
    return {
      ...resolved,
      label: link.label?.trim() || '',
    };
  }

  return {
    href: link.url?.trim() || '',
    newTab: Boolean(link.newTab),
    label: link.label?.trim() || '',
  };
}

/** Use plain anchor for external URLs, media files, and forced new-tab links. */
export function shouldUseNativeAnchor(href: string, newTab: boolean): boolean {
  if (!href) return true;
  if (newTab) return true;
  if (href.startsWith('http://') || href.startsWith('https://')) return true;
  if (href.startsWith('/media/')) return true;
  if (/\.(pdf|zip|doc|docx)(\?|#|$)/i.test(href)) return true;
  return false;
}
