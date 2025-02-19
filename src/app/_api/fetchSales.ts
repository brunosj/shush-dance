import type { Sale } from '../../payload/payload-types';

export const fetchSales = async (): Promise<Sale[]> => {
  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/sales?depth=0&limit=100`,
      {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        next: { revalidate: 1 },
      }
    );

    if (!response.ok) {
      console.error('Sales fetch failed:', await response.text());
      return [];
    }

    const salesRes = await response.json();
    return salesRes?.docs ?? [];
  } catch (error) {
    console.error('Error fetching sales:', error);
    return [];
  }
};
