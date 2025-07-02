import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '../../../payload/getPayload';
import config from '../../../payload/payload.config';

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient();
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

    // Create the online order
    const order = await payload.create({
      collection: 'online-orders',
      data: {
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
      },
    });

    // Create a sale record for tracking
    const sale = await payload.create({
      collection: 'sales',
      data: {
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
      },
    });

    return NextResponse.json({
      success: true,
      order: order.id,
      sale: sale.id,
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
