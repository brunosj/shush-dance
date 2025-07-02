import { Endpoint } from 'payload/config';

export const createOrderEndpoint: Endpoint = {
  path: '/create-order',
  method: 'post',
  handler: async (req, res) => {
    try {
      console.log('Payload endpoint: POST /api/create-order called');

      const {
        orderNumber,
        customerData,
        cartItems,
        totals,
        shippingRegion,
        paymentMethod = 'paypal',
        transactionId,
      } = req.body;

      console.log('Request data:', {
        hasOrderNumber: !!orderNumber,
        hasCustomerData: !!customerData,
        itemCount: cartItems?.length || 0,
        paymentMethod,
      });

      // Validate required fields
      if (!orderNumber || !customerData || !cartItems || !totals) {
        console.error('Missing required fields');
        return res.status(400).json({
          error: 'Missing required order data',
        });
      }

      console.log('Creating online order...');

      // Create the online order
      const order = await req.payload.create({
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
            product: null, // Optional: would map to actual CMS product in real scenario
            quantity: item.quantity,
            unitPrice: item.unitPrice / 100, // Convert from cents to euros
            lineTotal: item.lineTotal / 100,
            cartItemId: item.id,
            cartItemName: item.name,
            cartItemDescription: item.description,
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

      console.log('Order created successfully:', order.id);

      // Create a sale record for tracking
      console.log('Creating sale record...');
      let sale = null;
      try {
        sale = await req.payload.create({
          collection: 'sales',
          data: {
            itemName: `Order ${orderNumber}`,
            quantity: cartItems.reduce(
              (sum: number, item: any) => sum + item.quantity,
              0
            ),
            itemPrice: totals.subtotal,
            shipping: totals.shipping,
            sellerTax: totals.vat,
            netAmount: totals.total,
            currency: 'EUR',
            pointOfSale: paymentMethod,
            soldAt: new Date().toISOString(),
            buyerEmail: customerData.email,
            type: 'record', // Default type
            transactionId: transactionId || orderNumber,
          },
        });
        console.log('Sale record created successfully:', sale.id);
      } catch (saleError) {
        console.error('Failed to create sale record:', saleError);
        console.error('Order was created successfully, but sale record failed');
      }

      return res.status(200).json({
        success: true,
        order: order.id,
        sale: sale?.id || null,
        orderNumber,
      });
    } catch (error: any) {
      console.error('Create order error:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create order',
        details: error.message,
      });
    }
  },
};
