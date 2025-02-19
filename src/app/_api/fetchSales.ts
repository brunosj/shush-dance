import type { Sale } from '../../payload/payload-types';

export const fetchSales = async (): Promise<Sale[]> => {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/sales?depth=0&limit=100`,
    {
      next: { revalidate: 1 },
    }
  );

  const salesRes = await response.json();

  return salesRes?.docs ?? [];
};
