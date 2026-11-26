import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  GlobalAfterChangeHook,
} from 'payload';

import { CACHE_TAGS } from '../../app/_api/cacheTags';
import {
  safeRevalidatePath,
  safeRevalidateTag,
} from '../utilities/safeRevalidate';

/**
 * Catalog, media, and socials can show on the homepage and on their own routes.
 * Bust every cached read and every page under the root layout.
 */
function skipRevalidate(context?: { disableRevalidate?: unknown }): boolean {
  return (
    Boolean(context?.disableRevalidate) ||
    process.env.SLATE_TO_LEXICAL_DISABLE_HOOKS === 'true'
  );
}

function bustPublicSite(): void {
  safeRevalidateTag(CACHE_TAGS.site);
  safeRevalidateTag(CACHE_TAGS.pages);
  safeRevalidateTag(CACHE_TAGS.sitemap);
  safeRevalidatePath('/', 'layout');
}

/** Pages — tag + path for the slug; sitemap when published set changes. */
export const revalidatePage: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (skipRevalidate(context)) return doc;

  const isPublished = doc?._status === 'published';
  const wasPublished = previousDoc?._status === 'published';

  if (!isPublished && !wasPublished) return doc;

  const slug = typeof doc?.slug === 'string' ? doc.slug : null;
  const prevSlug =
    typeof previousDoc?.slug === 'string' ? previousDoc.slug : null;

  if (isPublished && slug) {
    const path = slug === 'home' ? '/' : `/${slug}`;
    payload.logger.info(`Revalidating page ${slug} → ${path}`);
    safeRevalidateTag(CACHE_TAGS.pages);
    safeRevalidateTag(CACHE_TAGS.page(slug));
    safeRevalidateTag(CACHE_TAGS.sitemap);
    safeRevalidatePath(path);
  }

  if (wasPublished && prevSlug && (!isPublished || prevSlug !== slug)) {
    const oldPath = prevSlug === 'home' ? '/' : `/${prevSlug}`;
    safeRevalidateTag(CACHE_TAGS.pages);
    safeRevalidateTag(CACHE_TAGS.page(prevSlug));
    safeRevalidateTag(CACHE_TAGS.sitemap);
    safeRevalidatePath(oldPath);
  }

  return doc;
};

export const revalidatePageDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context },
}) => {
  if (skipRevalidate(context)) return doc;
  const slug = typeof doc?.slug === 'string' ? doc.slug : null;
  if (slug) {
    safeRevalidateTag(CACHE_TAGS.pages);
    safeRevalidateTag(CACHE_TAGS.page(slug));
    safeRevalidateTag(CACHE_TAGS.sitemap);
    safeRevalidatePath(slug === 'home' ? '/' : `/${slug}`);
  }
  return doc;
};

/** Events — list pages + home embed. */
export const revalidateEvents: CollectionAfterChangeHook = ({
  doc,
  req: { context, payload },
}) => {
  if (skipRevalidate(context)) return doc;
  payload.logger.info('Revalidating all public pages after events change');
  bustPublicSite();
  return doc;
};

export const revalidateEventsDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context },
}) => {
  if (skipRevalidate(context)) return doc;
  bustPublicSite();
  return doc;
};

/** Releases — shop list + home embed. */
export const revalidateReleases: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (skipRevalidate(context)) return doc;
  const isPublished = doc?._status === 'published';
  const wasPublished = previousDoc?._status === 'published';
  if (!isPublished && !wasPublished) return doc;
  payload.logger.info('Revalidating all public pages after releases change');
  bustPublicSite();
  return doc;
};

export const revalidateReleasesDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context },
}) => {
  if (skipRevalidate(context)) return doc;
  bustPublicSite();
  return doc;
};

/** Merch — shop list + home embed. */
export const revalidateMerch: CollectionAfterChangeHook = ({
  doc,
  previousDoc,
  req: { context, payload },
}) => {
  if (skipRevalidate(context)) return doc;
  const isPublished = doc?._status === 'published';
  const wasPublished = previousDoc?._status === 'published';
  if (!isPublished && !wasPublished) return doc;
  payload.logger.info('Revalidating all public pages after merch change');
  bustPublicSite();
  return doc;
};

export const revalidateMerchDelete: CollectionAfterDeleteHook = ({
  doc,
  req: { context },
}) => {
  if (skipRevalidate(context)) return doc;
  bustPublicSite();
  return doc;
};

/** Media change can appear on any cached page that embeds it. */
export const revalidateMedia: CollectionAfterChangeHook = ({
  doc,
  req: { context, payload },
}) => {
  if (skipRevalidate(context)) return doc;
  payload.logger.info('Revalidating all public pages after media change');
  bustPublicSite();
  return doc;
};

export const revalidateSocials: GlobalAfterChangeHook = ({
  doc,
  req: { context, payload },
}) => {
  if (skipRevalidate(context)) return doc;
  payload.logger.info('Revalidating all public pages after socials change');
  bustPublicSite();
  return doc;
};
