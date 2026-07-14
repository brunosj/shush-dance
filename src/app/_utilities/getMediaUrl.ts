/**
 * Base URL for media assets. In local dev against a production DB, set
 * NEXT_PUBLIC_MEDIA_URL=https://shush.dance so images load from production
 * instead of localhost (where files may not exist).
 */
export function getMediaBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_MEDIA_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    '';

  return base.replace(/\/$/, '');
}

export function mediaUrlFromFilename(filename: string): string {
  if (!filename) return '';

  const normalized = filename.replace(/^\/+/, '').replace(/^media\//, '');
  const path = `/media/${normalized}`;
  const base = getMediaBaseUrl();

  return base ? `${base}${path}` : path;
}

/**
 * Resolve a Payload media URL (absolute, relative, or localhost) to the
 * configured media base. Falls back to filename when url is missing.
 */
export function resolveMediaUrl(
  urlOrPath: string | null | undefined,
  filename?: string | null
): string {
  if (!urlOrPath) {
    return filename ? mediaUrlFromFilename(filename) : '';
  }

  const value = urlOrPath.trim();
  if (!value) {
    return filename ? mediaUrlFromFilename(filename) : '';
  }

  // Unexpanded Payload media relationship id — use filename if available
  if (!value.includes('/') && !value.startsWith('http')) {
    return filename ? mediaUrlFromFilename(filename) : value;
  }

  const mediaBase = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, '');

  if (value.startsWith('http://') || value.startsWith('https://')) {
    if (mediaBase) {
      try {
        const parsed = new URL(value);
        const isLocal =
          parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';

        if (isLocal && parsed.pathname.startsWith('/media/')) {
          return `${mediaBase}${parsed.pathname}`;
        }
      } catch {
        return value;
      }
    }

    return value;
  }

  const path = value.startsWith('/') ? value : `/media/${value}`;
  const base = getMediaBaseUrl();

  return base ? `${base}${path}` : path;
}

export function resolveMediaResource(
  resource:
    | { url?: string | null; filename?: string | null }
    | string
    | null
    | undefined
): string {
  if (!resource) return '';

  if (typeof resource === 'string') {
    return resolveMediaUrl(resource);
  }

  return resolveMediaUrl(resource.url, resource.filename);
}
