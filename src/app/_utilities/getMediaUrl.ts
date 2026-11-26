import type { Media } from '../../payload/payload-types';

/**
 * Base origin for media assets. In local dev against a remote DB, set
 * `NEXT_PUBLIC_MEDIA_URL=https://shush.dance` so files load from the VPS
 * instead of missing local disk files.
 *
 * On the live site (same origin as `NEXT_PUBLIC_SERVER_URL`), URLs use
 * Caddy `/media/<filename>`. When the media origin differs from the app
 * (typical local dev), URLs use Payload `/api/media/file/<filename>`.
 */

export type MediaSizeName = 'thumb' | 'card';

export function getMediaBlurDataURL(
  media: Pick<Media, 'blurDataURL'> | null | undefined,
): string | undefined {
  const value = media?.blurDataURL?.trim();
  return value ? value : undefined;
}

function normalizeOrigin(url: string | undefined): string {
  return (url || '').replace(/\/$/, '');
}

export function getPublicServerUrl(): string {
  return normalizeOrigin(process.env.NEXT_PUBLIC_SERVER_URL);
}

export function getMediaBaseUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_MEDIA_URL ||
    process.env.NEXT_PUBLIC_SERVER_URL ||
    '';

  return normalizeOrigin(base);
}

const MEDIA_PUBLIC_PREFIX = '/media/';
const MEDIA_API_PREFIX = '/api/media/file/';

/** Caddy `/media` on the public site; Payload API when dev pulls from another origin. */
export function preferPayloadMediaApi(): boolean {
  const forced = process.env.NEXT_PUBLIC_MEDIA_PATH;
  if (forced === 'api') return true;
  if (forced === 'public') return false;

  const server = getPublicServerUrl();
  const base = getMediaBaseUrl();

  if (!base) return true;

  if (server && base !== server) {
    return true;
  }

  try {
    const serverHost = server ? new URL(server).hostname : '';
    const baseHost = new URL(base).hostname;
    if (serverHost && serverHost !== baseHost) return true;
    if (baseHost === 'localhost' || baseHost === '127.0.0.1') return true;
  } catch {
    return true;
  }

  return false;
}

function mediaPathPrefix(): string {
  return preferPayloadMediaApi() ? MEDIA_API_PREFIX : MEDIA_PUBLIC_PREFIX;
}

function filenameFromMediaPath(pathname: string): string | null {
  const path = pathname.split(/[?#]/)[0];

  if (path.startsWith(MEDIA_API_PREFIX)) {
    return decodeURIComponent(path.slice(MEDIA_API_PREFIX.length));
  }

  if (path.startsWith(MEDIA_PUBLIC_PREFIX)) {
    return decodeURIComponent(path.slice(MEDIA_PUBLIC_PREFIX.length));
  }

  return null;
}

function encodeMediaPath(filename: string): string {
  return filename
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

function buildMediaPath(normalizedFilename: string): string {
  return `${mediaPathPrefix()}${encodeMediaPath(normalizedFilename)}`;
}

/** Absolute or relative URL for a stored media filename. */
export function mediaUrlFromFilename(filename: string): string {
  if (!filename) return '';

  const fromPath = filenameFromMediaPath(
    filename.startsWith('/') ? filename : `/${filename}`,
  );
  const normalized = (fromPath ?? filename)
    .replace(/^\/+/, '')
    .replace(/^media\//, '');
  const path = buildMediaPath(normalized);
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

  const mediaBase = normalizeOrigin(process.env.NEXT_PUBLIC_MEDIA_URL);

  if (value.startsWith('http://') || value.startsWith('https://')) {
    try {
      const parsed = new URL(value);
      const fileName = filenameFromMediaPath(parsed.pathname);

      if (!fileName) return value;

      const isLocal =
        parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1';
      const path = buildMediaPath(fileName);

      if (
        mediaBase &&
        (isLocal ||
          parsed.pathname.startsWith('/media/') ||
          parsed.pathname.startsWith(MEDIA_API_PREFIX))
      ) {
        return `${mediaBase}${path}`;
      }

      if (
        parsed.pathname.startsWith('/media/') ||
        parsed.pathname.startsWith(MEDIA_API_PREFIX)
      ) {
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

type MediaLike = {
  url?: string | null;
  filename?: string | null;
  sizes?: Media['sizes'];
};

export function resolveMediaResource(
  resource: MediaLike | string | null | undefined,
  size?: MediaSizeName,
): string {
  if (!resource) return '';

  if (typeof resource === 'string') {
    return resolveMediaUrl(resource);
  }

  if (size && resource.sizes?.[size]) {
    const sized = resource.sizes[size];
    if (sized?.filename) {
      return mediaUrlFromFilename(sized.filename);
    }
    if (sized?.url) {
      return resolveMediaUrl(sized.url);
    }
  }

  // Disk `filename` is authoritative. Many Media.url values still point at
  // stale /media/ basenames (e.g. Foo.png vs Foo-1.png after re-upload).
  if (resource.filename) {
    return mediaUrlFromFilename(resource.filename);
  }

  return resolveMediaUrl(resource.url);
}