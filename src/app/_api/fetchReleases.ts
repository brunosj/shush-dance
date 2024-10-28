import type { Event } from '../../payload/payload-types';

export const fetchReleases = async (): Promise<Event[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/releases`,
    {
      method: 'GET',
    }
  );

  const releasesRes = await response.json();

  return releasesRes?.docs ?? [];
};
