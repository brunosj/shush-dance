import type { Media } from '../../payload/payload-types';

/**
 * Base URL for media assets. In local dev against a production DB, set
 * NEXT_PUBLIC_MEDIA_URL=https://shush.dance so images load from production
 * instead of localhost (where files may not exist).
 */

export function getMediaBlurDataURL(
  media: Pick<Media, 'blurDataURL'> | null | undefined,
): string | undefined {
  const value = media?.blurDataURL?.trim();
  return value ? value : undefined;
}
export function getMediaBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_MEDIA_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    '';

  return base.replace(/\/$/, '');
}

const MEDIA_FILE_PREFIX = '/api/media/file/';

function filenameFromMediaPath(pathname: string): string | null {
  const path = pathname.split(/[?#]/)[0];

  if (path.startsWith(MEDIA_FILE_PREFIX)) {
    return path.slice(MEDIA_FILE_PREFIX.length);
  }

  if (path.startsWith('/media/')) {
    return path.slice('/media/'.length);
  }

  return null;
}

export function mediaUrlFromFilename(filename: string): string {
  if (!filename) return '';

  const fromPath = filenameFromMediaPath(
    filename.startsWith('/') ? filename : `/${filename}`,
  );
  const normalized = (fromPath ?? filename)
    .replace(/^\/+/, '')
    .replace(/^media\//, '');
  const path = `${MEDIA_FILE_PREFIX}${normalized}`;
  const base = getMediaBaseUrl();

  return base ? `${base}${path}` : path;
}

/**
 * Resolve a Payload media URL (absolute, relative, or localhost) to the
 * configured media base. Falls back to filename when url is missing.
 */
export function resolveMediaUrl(
  urlOrPath: string | null | undefined,
  filename?: string | null,
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
    return mediaUrlFromFilename(filename || value);
  }

  const mediaBase = process.env.NEXT_PUBLIC_MEDIA_URL?.replace(/\/$/, '');

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      const fileName = filenameFromMediaPath(parsed.pathname);

      if (!fileName) return value;

      const isLocal =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      const path = `${MEDIA_FILE_PREFIX}${fileName}`;

      if (mediaBase && (isLocal || parsed.pathname.startsWith('/media/'))) {
        return `${mediaBase}${path}`;
      }

      if (parsed.pathname.startsWith('/media/')) {
        return `${parsed.origin}${path}`;
      }
    } catch {
      return value;
    }

    return value;
  }

  const fileName = filenameFromMediaPath(
    value.startsWith('/') ? value : `/${value}`,
  );

  return mediaUrlFromFilename(fileName ?? value);
}

export function resolveMediaResource(
  resource:
    | { url?: string | null; filename?: string | null }
    | string
    | null
    | undefined,
): string {
  if (!resource) return '';

  if (typeof resource === 'string') {
    return resolveMediaUrl(resource);
  }

  // Disk `filename` is authoritative. Many Media.url values still point at
  // stale /media/ basenames (e.g. Foo.png vs Foo-1.png after re-upload).
  if (resource.filename) {
    return mediaUrlFromFilename(resource.filename);
  }

  return resolveMediaUrl(resource.url);
}
