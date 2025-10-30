import type { TicketSale } from '../../payload/payload-types';

// Check auth status
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

export const fetchTicketSales = async (): Promise<{
  ticketSales: TicketSale[];
}> => {
  try {
    // Check authentication first
    const user = await checkAuth();

    if (!user) {
      throw new Error('Not authenticated');
    }

    console.log('Authenticated user:', user);

    const ticketSalesResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/ticket-sales?depth=2&limit=1000`,
      {
        credentials: 'include',
      }
    );

    if (!ticketSalesResponse.ok) {
      console.error('Failed to fetch ticket sales:', ticketSalesResponse.statusText);
      return { ticketSales: [] };
    }

    const ticketSalesRes = await ticketSalesResponse.json();

    if (!ticketSalesRes?.docs || !Array.isArray(ticketSalesRes.docs)) {
      console.error('Invalid ticket sales response format:', ticketSalesRes);
      return { ticketSales: [] };
    }

    // Ensure each ticket sale has required fields
    const validTicketSales = ticketSalesRes.docs.map((ticketSale: any) => ({
      ...ticketSale,
      status: ticketSale.status || 'active',
      paymentStatus: ticketSale.paymentStatus || 'pending',
      tickets: ticketSale.tickets || [],
      ticketTotals: ticketSale.ticketTotals || {
        subtotal: 0,
        vat: 0,
        total: 0,
      },
    }));

    return {
      ticketSales: validTicketSales,
    };
  } catch (error) {
    console.error('Error fetching ticket sales:', error);
    return { ticketSales: [] };
  }
};

