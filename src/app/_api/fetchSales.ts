import type { Sale } from '../../payload-types';

// First, let's create a function to check auth status
export const checkAuth = async () => {
  console.log(
    'Checking auth at:',
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users/me`
  );

  const response = await fetch(
    `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/users/me`,
    {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );

  console.log('Auth response status:', response.status);
  console.log('Auth response headers:', response.headers);

  const userData = await response.json();
  console.log('Auth check response:', userData);

  if (!response.ok || !userData.user) {
    return null;
  }

  return userData.user;
};

export const fetchSales = async (): Promise<{
  sales: Sale[];
  lastSyncedAt: string | null;
}> => {
  try {
    // Check authentication first
    const user = await checkAuth();

    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Authenticated user:', user);

    const [salesResponse, settingsResponse] = await Promise.all([
      fetch(
        `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/sales?depth=1&limit=1000`,
        {
          credentials: 'include',
        }
      ),
      fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/globals/settings`, {
        credentials: 'include',
      }),
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
