import type { Page } from '../../payload-types';

export const fetchPages = async (): Promise<Page[]> => {
  const pageRes: {
    docs: Page[];
  } = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/pages?depth=0&limit=100`,
    {
      next: { revalidate: 1 },
    }
  ).then((res) => res.json()); // eslint-disable-line function-paren-newline

  return pageRes?.docs ?? [];
};
