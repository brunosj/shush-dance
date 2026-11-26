import { revalidatePath, revalidateTag } from 'next/cache';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

function getRevalidationSecret(): string | undefined {
  return (
    process.env.NEXT_PRIVATE_REVALIDATION_KEY || process.env.REVALIDATION_KEY
  );
}

export async function GET(request: NextRequest): Promise<Response> {
  const collection = request.nextUrl.searchParams.get('collection');
  const slug = request.nextUrl.searchParams.get('slug');
  const path = request.nextUrl.searchParams.get('revalidatePath');
  const secret = request.nextUrl.searchParams.get('secret');
  const expectedSecret = getRevalidationSecret();

  if (!secret || !expectedSecret || secret !== expectedSecret) {
    // Do not indicate that the revalidation key is incorrect in the response
    // This will protect this API route from being exploited
    return new Response('Invalid request', { status: 400 });
  }

  const revalidated: { tags: string[]; paths: string[] } = {
    tags: [],
    paths: [],
  };

  if (typeof collection === 'string' && typeof slug === 'string') {
    const tag = `${collection}_${slug}`;
    revalidateTag(tag, 'max');
    revalidated.tags.push(tag);

    // Also bust the page route itself (home lives at `/`)
    const routePath = collection === 'pages' ? (slug === 'home' ? '/' : `/${slug}`) : `/${collection}/${slug}`;
    revalidatePath(routePath);
    revalidated.paths.push(routePath);
  }

  if (typeof path === 'string' && path.startsWith('/')) {
    revalidatePath(path);
    revalidated.paths.push(path);
  }

  if (revalidated.tags.length === 0 && revalidated.paths.length === 0) {
    return new Response('Invalid request', { status: 400 });
  }

  return NextResponse.json({ revalidated: true, ...revalidated, now: Date.now() });
}
