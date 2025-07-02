import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      itemId,
      itemType,
      itemName,
      quantity,
      basePrice,
      shippingPrice,
      vatAmount,
      totalAmount,
      currency,
      paymentMethod,
      shippingRegion,
      customerEmail,
      transactionId,
    } = body;

    // Create sales record via Payload REST API
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_PAYLOAD_URL}/api/sales`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `users API-Key ${process.env.PAYLOAD_API_KEY}`,
        },
        body: JSON.stringify({
          itemName: itemName,
          cmsItem: itemId,
          type: itemType === 'release' ? 'record' : 'merch',
          pointOfSale: paymentMethod === 'stripe' ? 'stripe' : 'paypal',
          soldAt: new Date().toISOString(),
          itemPrice: basePrice,
          quantity: quantity,
          currency: currency,
          subTotal: basePrice * quantity,
          shipping: shippingPrice,
          sellerTax: vatAmount,
          amount: totalAmount,
          // Store additional metadata
          paymentMetadata: {
            transactionId,
            shippingRegion,
            customerEmail,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to create sale: ${response.statusText}`);
    }

    const sale = await response.json();

    return NextResponse.json({ success: true, saleId: sale.id });
  } catch (error) {
    console.error('Error creating sale record:', error);
    return NextResponse.json(
      { error: 'Failed to create sale record' },
      { status: 500 }
    );
  }
}
