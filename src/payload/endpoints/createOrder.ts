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

      // Send confirmation emails
      console.log('Sending confirmation emails...');
      try {
        // Format order items for email
        const itemsList = cartItems
          .map(
            (item: any) =>
              `• ${item.name} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`
          )
          .join('\n');

        const orderSummary = `
Order Number: ${orderNumber}
Customer: ${customerData.firstName} ${customerData.lastName}
Email: ${customerData.email}

Items:
${itemsList}

Subtotal: €${(totals.subtotal / 100).toFixed(2)}
Shipping: €${(totals.shipping / 100).toFixed(2)}
VAT: €${(totals.vat / 100).toFixed(2)}
Total: €${(totals.total / 100).toFixed(2)}

Shipping Address:
${customerData.firstName} ${customerData.lastName}
${customerData.street}
${customerData.city}, ${customerData.postalCode}
${customerData.country}
        `;

        // Send confirmation email to customer
        await req.payload.sendEmail({
          to: customerData.email,
          from: 'hello@shush.dance',
          subject: `Order Confirmation - ${orderNumber}`,
          html: `
            <h2>Thank you for your order!</h2>
            <p>Hi ${customerData.firstName},</p>
            <p>We've received your order and it's being processed. Here are the details:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${orderSummary}</pre>
            <p>We'll notify you by email when your order is shipped.</p>
            <p>Thanks for supporting us and what we do!</p>
            <p>- SHUSH crew</p>
          `,
        });
        console.log('Customer confirmation email sent');

        // Send notification email to merch team
        await req.payload.sendEmail({
          to: 'merch@shush.dance',
          from: 'hello@shush.dance',
          subject: `New Order - ${orderNumber}`,
          html: `
            <h2>New Order Received</h2>
            <p>A new order has been placed:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${orderSummary}</pre>
            <p>Payment Method: ${paymentMethod}</p>
            <p>Transaction ID: ${transactionId || 'Pending'}</p>
            ${customerData.customerNotes ? `<p>Customer Notes: ${customerData.customerNotes}</p>` : ''}
          `,
        });
        console.log('Merch team notification email sent');
      } catch (emailError) {
        console.error('Failed to send emails:', emailError);
        // Don't fail the order creation if emails fail
      }

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
