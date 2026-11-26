const DEFAULT_SITE_URL = 'https://shush.dance';

export function getSiteUrl(): string {
  const base =
    process.env.NEXT_PUBLIC_SERVER_URL?.trim() ||
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.trim() ||
    DEFAULT_SITE_URL;

  return base.replace(/\/$/, '');
}

export function isSiteLiveForSeo(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_IS_LIVE);
}