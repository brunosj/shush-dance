import type { Merch } from '../../payload-types';

export const fetchMerch = async (): Promise<Merch[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/merch?depth=2&limit=0`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
      },
      next: { revalidate: 1 },
    }
  );

  const merchRes = await response.json();

  return merchRes?.docs ?? [];
};
