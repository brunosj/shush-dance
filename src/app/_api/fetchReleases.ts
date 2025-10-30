import type { Release } from '../../payload-types';

export const fetchReleases = async (): Promise<Release[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/releases?depth=2&limit=0`,
    {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
      },
      next: { revalidate: 1 },
    }
  );

  const releasesRes = await response.json();

  return releasesRes?.docs ?? [];
};
