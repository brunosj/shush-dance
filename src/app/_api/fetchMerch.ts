import type { Event } from '../../payload/payload-types';

export const fetchMerch = async (): Promise<Event[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/merch`,
    {
      method: 'GET',
    }
  );

  const merchRes = await response.json();

  return merchRes?.docs ?? [];
};
