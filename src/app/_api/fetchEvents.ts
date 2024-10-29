import type { Page } from '../../payload/payload-types';

export const fetchEvents = async (): Promise<Page[]> => {
  const pageRes: {
    docs: Page[];
  } = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/events?depth=2&limit=0`,
    {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
      },
      next: { revalidate: 1 },
    }
  ).then((res) => res.json()); // eslint-disable-line function-paren-newline

  return pageRes?.docs ?? [];
};
