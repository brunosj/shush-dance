import { unstable_cache } from 'next/cache';

/**
 * Wrap Payload queries with Next.js data cache in production only.
 * In development, always hit the DB so CMS edits show without clearing `.next`.
 */
export function cached<T>(
  fn: () => Promise<T>,
  keyParts: string[],
  options: { tags: string[]; revalidate?: number | false },
): () => Promise<T> {
  if (process.env.NODE_ENV === 'development') {
    return fn;
  }

  return unstable_cache(fn, keyParts, {
    tags: options.tags,
    revalidate: options.revalidate ?? false,
  });
}