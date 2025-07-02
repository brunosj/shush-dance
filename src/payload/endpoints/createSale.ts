import { Endpoint } from 'payload/config';

export const createSaleEndpoint: Endpoint = {
  path: '/create-sale',
  method: 'post',
  handler: async (req, res) => {
    try {
      console.log('Payload endpoint: POST /api/create-sale called');

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
      } = req.body;

      console.log('Request data:', {
        hasItemName: !!itemName,
        itemType,
        quantity,
        paymentMethod,
      });

      // Validate required fields
      if (
        !itemName ||
        !quantity ||
        !totalAmount ||
        !currency ||
        !paymentMethod
      ) {
        console.error('Missing required fields');
        return res.status(400).json({
          error: 'Missing required sale data',
        });
      }

      console.log('Creating sale record...');

      // Create sales record directly via Payload
      const sale = await req.payload.create({
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
          netAmount: totalAmount,
          buyerEmail: customerEmail,
          // Store additional metadata in appropriate fields
          bandcampTransactionId: transactionId,
          regionOrState: shippingRegion,
        },
      });

      console.log('Sale record created successfully:', sale.id);

      return res.status(200).json({
        success: true,
        saleId: sale.id,
      });
    } catch (error: any) {
      console.error('Create sale error:', error);
      return res.status(500).json({
        error: 'Failed to create sale record',
        details: error.message,
      });
    }
  },
};
