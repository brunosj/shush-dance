import { Endpoint } from 'payload/config';

export const createOrderEndpoint: Endpoint = {
  path: '/create-order',
  method: 'post',
  handler: async (req, res) => {
    try {
      const {
        orderNumber,
        customerData,
        cartItems,
        totals,
        shippingRegion,
        paymentMethod = 'paypal',
        transactionId,
      } = req.body;

      // Validate required fields
      if (!orderNumber || !customerData || !cartItems || !totals) {
        console.error('Missing required fields');
        return res.status(400).json({
          error: 'Missing required order data',
        });
      }

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

      // Send confirmation emails
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

Subtotal: €${totals.subtotal.toFixed(2)}
Shipping: €${totals.shipping.toFixed(2)}
VAT: €${totals.vat.toFixed(2)}
Total: €${totals.total.toFixed(2)}

Shipping Address:
${customerData.firstName} ${customerData.lastName}
${customerData.street}
${customerData.city}, ${customerData.postalCode}
${customerData.country}
        `;

        // Send confirmation email to customer
        await req.payload.sendEmail({
          to: customerData.email,
          from: `SHUSH <${process.env.SMTP_USER}>`, // Display as SHUSH but use SMTP user
          replyTo: 'SHUSH <hello@shush.dance>',
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

        // Send notification email to merch team
        await req.payload.sendEmail({
          to: 'merch@shush.dance',
          from: `SHUSH <${process.env.SMTP_USER}>`, // Display as SHUSH but use SMTP user
          replyTo: 'SHUSH <hello@shush.dance>',
          subject: `New Order  - ${orderNumber}`,
          html: `
            <h2>New Order Received</h2>
            <p>A new order has been placed:</p>
            <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${orderSummary}</pre>
            <p>Payment Method: ${paymentMethod}</p>
            <p>Transaction ID: ${transactionId || 'Pending'}</p>
            ${customerData.customerNotes ? `<p>Customer Notes: ${customerData.customerNotes}</p>` : ''}
          `,
        });
      } catch (emailError) {
        console.error('Failed to send emails:', emailError);
        // Don't fail the order creation if emails fail
      }

      // Create individual sale records for each cart item
      const saleRecords = [];

      // Calculate per-item shipping and VAT proportionally
      const totalItemsValue = cartItems.reduce(
        (sum: number, item: any) => sum + item.lineTotal,
        0
      );

      for (const item of cartItems) {
        try {
          // Calculate proportional shipping and VAT for this item
          const itemProportion = item.lineTotal / totalItemsValue;
          const itemShipping = totals.shipping * itemProportion;
          const itemVAT = totals.vat * itemProportion;

          const saleData: any = {
            itemName: item.name,
            type: item.type === 'release' ? 'record' : 'merch',
            pointOfSale: paymentMethod === 'stripe' ? 'stripe' : 'paypal',
            soldAt: new Date().toISOString(),
            itemPrice: item.unitPrice / 100, // Convert from cents to euros
            quantity: item.quantity,
            currency: 'EUR',
            subTotal: item.lineTotal / 100, // Convert from cents to euros
            shipping: itemShipping,
            sellerTax: itemVAT,
            netAmount: item.lineTotal / 100 + itemShipping + itemVAT,
            buyerEmail: customerData.email,
            bandcampTransactionId: transactionId || orderNumber,
            regionOrState: shippingRegion,
          };

          // Note: No longer adding cmsItem relationship since we have the item name

          const sale = await req.payload.create({
            collection: 'sales',
            data: saleData,
          });

          saleRecords.push(sale.id);
        } catch (saleError) {
          console.error(
            `Failed to create sale record for item ${item.name}:`,
            saleError
          );
          // Continue with other items even if one fails
        }
      }

      return res.status(200).json({
        success: true,
        order: order.id,
        saleRecords: saleRecords,
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
