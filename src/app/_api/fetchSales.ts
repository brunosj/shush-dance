import type { Sale } from '../../payload/payload-types';

export const fetchSales = async (): Promise<{
  sales: Sale[];
  lastSyncedAt: string | null;
}> => {
  try {
    const [salesResponse, settingsResponse] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/sales?depth=1&limit=1000`
      ),
      fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/settings`),
    ]);

    if (!salesResponse.ok) {
      console.error('Failed to fetch sales:', salesResponse.statusText);
      return { sales: [], lastSyncedAt: null };
    }

    const salesRes = await salesResponse.json();
    const settingsRes = await settingsResponse.json();

    if (!salesRes?.docs || !Array.isArray(salesRes.docs)) {
      console.error('Invalid sales response format:', salesRes);
      return { sales: [], lastSyncedAt: null };
    }

    // Ensure each sale has required fields
    const validSales = salesRes.docs.map((sale: any) => ({
      ...sale,
      type: sale.type || 'unknown',
      itemTotal: sale.itemTotal || 0,
      netAmount: sale.netAmount || 0,
      currency: sale.currency || 'EUR',
      soldAt: sale.soldAt || new Date().toISOString(),
    }));

    return {
      sales: validSales,
      lastSyncedAt: settingsRes?.lastBandcampSync || null,
    };
  } catch (error) {
    console.error('Error fetching sales:', error);
    return { sales: [], lastSyncedAt: null };
  }
};
