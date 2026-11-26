import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { CACHE_TAGS } from '../../../_api/cacheTags';

function getRevalidationSecret(): string | undefined {
  return (
    process.env.NEXT_PRIVATE_REVALIDATION_KEY || process.env.REVALIDATION_KEY
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const collection = request.nextUrl.searchParams.get('collection');
  const slug = request.nextUrl.searchParams.get('slug');
  const path = request.nextUrl.searchParams.get('revalidatePath');
  const tag = request.nextUrl.searchParams.get('tag');
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = getRevalidationSecret();

  if (!secret || !expectedSecret || secret !== expectedSecret) {
    return new Response('Invalid request', { status: 400 });
  }

  const revalidated: { tags: string[]; paths: string[] } = {
    tags: [],
    paths: [],
  };

  if (typeof tag === 'string' && tag.length > 0) {
    revalidateTag(tag, 'max');
    revalidated.tags.push(tag);
    if (tag === CACHE_TAGS.site) {
      revalidatePath('/', 'layout');
      revalidated.paths.push('/ (layout)');
    }
  }

  if (typeof collection === 'string') {
    const collectionTag =
      collection === 'pages'
        ? CACHE_TAGS.pages
        : collection === 'events'
          ? CACHE_TAGS.events
          : collection === 'releases'
            ? CACHE_TAGS.releases
            : collection === 'merch'
              ? CACHE_TAGS.merch
              : collection === 'socials'
                ? CACHE_TAGS.socials
                : `${collection}`;

    revalidateTag(collectionTag, 'max');
    revalidated.tags.push(collectionTag);

    if (collection !== 'pages') {
      revalidateTag(CACHE_TAGS.site, 'max');
      revalidated.tags.push(CACHE_TAGS.site);
      revalidatePath('/', 'layout');
      revalidated.paths.push('/ (layout)');
    }

    if (typeof slug === 'string' && collection === 'pages') {
      revalidateTag(CACHE_TAGS.page(slug), 'max');
      revalidated.tags.push(CACHE_TAGS.page(slug));
      const routePath = slug === 'home' ? '/' : `/${slug}`;
      revalidatePath(routePath);
      revalidated.paths.push(routePath);
    }
  }

  if (typeof path === 'string' && path.startsWith('/')) {
    revalidatePath(path);
    revalidated.paths.push(path);
  }

  if (revalidated.tags.length === 0 && revalidated.paths.length === 0) {
    return new Response('Invalid request', { status: 400 });
  }

  return NextResponse.json({
    revalidated: true,
    ...revalidated,
    now: Date.now(),
  });
}