import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();

    const {
      orderNumber,
      customerData,
      cartItems,
      totals,
      shippingRegion,
      paymentMethod = 'paypal',
      transactionId,
    } = data;

    // Create the online order via Payload REST API
    const orderResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/online-orders`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
        },
        body: JSON.stringify({
          orderNumber,
          status: 'pending',
          paymentMethod,
          paymentStatus: transactionId ? 'paid' : 'pending',
          transactionId,
          customerEmail: customerData.email,
          customerPhone: customerData.phone || '',
          firstName: customerData.firstName,
          lastName: customerData.lastName,
          shippingAddress: {
            street: customerData.street,
            city: customerData.city,
            postalCode: customerData.postalCode,
            country: customerData.country,
            shippingRegion,
          },
          items: cartItems.map((item: any) => ({
            // We'll need to find the actual product ID from the cart item ID
            product: null, // This will need to be mapped from cart item data
            quantity: item.quantity,
            unitPrice: item.unitPrice / 100, // Convert from cents to euros
            lineTotal: item.lineTotal / 100,
          })),
          orderTotals: {
            subtotal: totals.subtotal,
            shipping: totals.shipping,
            vat: totals.vat,
            total: totals.total,
          },
          customerNotes: customerData.customerNotes || '',
        }),
      }
    );

    if (!orderResponse.ok) {
      throw new Error(`Failed to create order: ${orderResponse.statusText}`);
    }

    const order = await orderResponse.json();

    // Create a sale record for tracking via Payload REST API
    const saleResponse = await fetch(
      `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/sales`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
        },
        body: JSON.stringify({
          itemName: `Order ${orderNumber}`,
          quantity: cartItems.reduce(
            (sum: number, item: any) => sum + item.quantity,
            0
          ),
          basePrice: totals.subtotal,
          shippingPrice: totals.shipping,
          vatAmount: totals.vat,
          totalAmount: totals.total,
          currency: 'EUR',
          paymentMethod: paymentMethod,
          shippingRegion,
          transactionId: transactionId || orderNumber, // Use transaction ID if available, otherwise order number
        }),
      }
    );

    if (!saleResponse.ok) {
      console.error('Failed to create sale record, but order was created');
    }

    const sale = saleResponse.ok ? await saleResponse.json() : null;

    return NextResponse.json({
      success: true,
      order: order.id,
      sale: sale?.id || null,
      orderNumber,
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create order',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
