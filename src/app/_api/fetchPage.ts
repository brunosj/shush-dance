import type { Page } from '../../payload/payload-types';
import { PayloadFetchError } from '../_utilities/payloadFetchError';

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

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new PayloadFetchError(
      `Payload API returned ${res.status} for slug "${slug}"${body ? `: ${body.slice(0, 120)}` : ''}`,
      { status: res.status, slug, context: 'fetchPage' }
    );
  }

  const pageRes: { docs?: Page[] } = await res.json();

  return pageRes?.docs?.[0] ?? null;
};
