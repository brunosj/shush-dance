import { NextRequest, NextResponse } from 'next/server';
import { getPayloadClient } from '../../../payload/getPayload';
import config from '../../../payload/payload.config';

export async function POST(request: NextRequest) {
  try {
    const payload = await getPayloadClient();
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

    // Create sales record
    const sale = await payload.create({
      collection: 'sales',
      data: {
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
      },
    });

    return NextResponse.json({ success: true, saleId: sale.id });
  } catch (error) {
    console.error('Error creating sale record:', error);
    return NextResponse.json(
      { error: 'Failed to create sale record' },
      { status: 500 }
    );
  }
}
