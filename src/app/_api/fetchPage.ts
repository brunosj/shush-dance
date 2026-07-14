import type { Page } from '../../payload/payload-types';

export const fetchPage = async (
  slug: string
): Promise<Page | undefined | null> => {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?where[slug][equals]=${slug}&depth=2`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
      },
    }
  );

  // Guard against non-OK / non-JSON responses (e.g. a rate-limit 429 returns
  // plain text "Too many requests"). Parsing that as JSON used to throw and
  // hard-404 the whole page, so we degrade gracefully instead.
  if (!res.ok) {
    console.error(
      `fetchPage: unexpected ${res.status} response for slug "${slug}"`
    );
    return null;
  }

  const pageRes: { docs?: Page[] } = await res.json();

  return pageRes?.docs?.[0] ?? null;
};
