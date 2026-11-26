import type { Endpoint } from 'payload';

export const createSaleEndpoint: Endpoint = {
  path: '/create-sale',
  method: 'post',
  handler: async (req) => {
    try {
      const body = (await req.json()) as any;
      const {
        itemId: _itemId,
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

      // Validate required fields
      if (
        !itemName ||
        !quantity ||
        !totalAmount ||
        !currency ||
        !paymentMethod
      ) {
        console.error('Missing required fields');
        return Response.json({
          error: 'Missing required sale data',
        }, { status: 400 });
      }

      // Prepare the sale data
      const saleData: any = {
        itemName: itemName,
        type: itemType === 'release' ? 'record' : 'merch',
        pointOfSale: paymentMethod === 'stripe' ? 'stripe' : 'paypal',
        soldAt: new Date().toISOString(),
        itemPrice: basePrice,
        quantity: quantity,
        currency: currency,
        subTotal: basePrice * quantity,
        shipping: shippingPrice,
        sellerTax: vatAmount,
        netAmount: totalAmount,
        buyerEmail: customerEmail,
        // Store additional metadata in appropriate fields
        bandcampTransactionId: transactionId,
        regionOrState: shippingRegion,
      };

      // Note: No longer adding cmsItem relationship since we have the item name

      // Create sales record directly via Payload
      const sale = await req.payload.create({
        collection: 'sales',
        data: saleData,
      });

      return Response.json({
        success: true,
        saleId: sale.id,
      });
    } catch (error: any) {
      console.error('Create sale error:', error);
      return Response.json({
        error: 'Failed to create sale record',
        details: error.message,
      }, { status: 500 });
    }
  },
};
