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

      // Separate ticket items from physical items
      const ticketItems = cartItems.filter((item: any) => {
        return (
          item.type === 'ticket' ||
          (item.metadata && item.metadata.type === 'ticket')
        );
      });

      const physicalItems = cartItems.filter(
        (item: any) =>
          item.type !== 'ticket' &&
          (!item.metadata || item.metadata.type !== 'ticket')
      );

      let order = null;

      // Only create an online order if there are physical items that need shipping
      if (physicalItems.length > 0) {
        order = await req.payload.create({
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
              street: customerData.street || '',
              city: customerData.city || '',
              postalCode: customerData.postalCode || '',
              country: customerData.country || '',
              shippingRegion,
            },
            items: physicalItems.map((item: any) => ({
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
      }

      // Send confirmation emails for physical items (excluding tickets which get separate emails)
      if (physicalItems.length > 0) {
        try {
          // Format order items for email (excluding tickets)
          const itemsList = physicalItems
            .map(
              (item: any) =>
                `• ${item.name} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`
            )
            .join('\n');

          // Calculate totals for physical items only
          const physicalSubtotal =
            physicalItems.reduce(
              (sum: number, item: any) => sum + item.lineTotal,
              0
            ) / 100;
          const physicalTotal = physicalSubtotal + totals.shipping + totals.vat;

          const orderSummary = `
Order Number: ${orderNumber}
Customer: ${customerData.firstName} ${customerData.lastName}
Email: ${customerData.email}

Items:
${itemsList}

Subtotal: €${physicalSubtotal.toFixed(2)}
Shipping: €${totals.shipping.toFixed(2)}
VAT: €${totals.vat.toFixed(2)}
Total: €${physicalTotal.toFixed(2)}

Shipping Address:
${customerData.firstName} ${customerData.lastName}
${customerData.street}
${customerData.city}, ${customerData.postalCode}
${customerData.country}
          `;

          // Send confirmation email to customer
          await req.payload.sendEmail({
            to: customerData.email,
            from: `SHUSH <${process.env.SMTP_USER}>`,
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
            to: 'hello@shush.dance',
            from: `SHUSH <${process.env.SMTP_USER}>`,
            replyTo: 'SHUSH <hello@shush.dance>',
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
        } catch (emailError) {
          console.error('Failed to send order emails:', emailError);
          // Don't fail the order creation if emails fail
        }
      }

      // Create individual sale records for each cart item and ticket sales for tickets
      const saleRecords = [];
      const ticketSaleRecords = [];

      // If there are tickets, create a ticket sale record
      if (ticketItems.length > 0) {
        try {
          const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Calculate ticket totals
          const ticketSubtotal =
            ticketItems.reduce(
              (sum: number, item: any) => sum + item.lineTotal,
              0
            ) / 100;
          const ticketVAT = 0; // Tickets are typically VAT-exempt
          const ticketTotal = ticketSubtotal + ticketVAT;

          // Extract event information from the first ticket item
          const firstTicket = ticketItems[0];
          const eventMetadata = firstTicket?.metadata || {};

          const ticketSaleData = {
            ticketNumber,
            status: 'active',
            event: eventMetadata.eventId || null, // Use event ID from metadata if available
            ticketTier: firstTicket?.name || 'General Admission',
            paymentMethod,
            paymentStatus: transactionId ? 'paid' : 'pending',
            transactionId,
            customerEmail: customerData.email,
            customerPhone: customerData.phone || '',
            firstName: customerData.firstName,
            lastName: customerData.lastName,
            tickets: ticketItems.map((item: any) => ({
              cartItemId: item.id,
              ticketName: item.name,
              ticketDescription: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice / 100,
              lineTotal: item.lineTotal / 100,
              stripePriceId: item.stripePriceId || '',
            })),
            ticketTotals: {
              subtotal: ticketSubtotal,
              vat: ticketVAT,
              total: ticketTotal,
            },
            // Copy event details from metadata if available
            eventDate: eventMetadata.eventDate || null,
            eventLocation: eventMetadata.eventLocation || null,
            eventTitle:
              eventMetadata.eventTitle || firstTicket?.parentItem || null,
            customerNotes: customerData.customerNotes || '',
          };

          const ticketSale = await req.payload.create({
            collection: 'ticket-sales',
            data: ticketSaleData,
          });

          ticketSaleRecords.push(ticketSale.id);

          // Send ticket confirmation emails
          try {
            // Format ticket items for email
            const ticketsList = ticketItems
              .map(
                (item: any) =>
                  `• ${item.name} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`
              )
              .join('\n');

            const ticketSummary = `
Ticket Number: ${ticketNumber}
Customer: ${customerData.firstName} ${customerData.lastName}
Email: ${customerData.email}
Event: ${ticketItems[0]?.parentItem || 'Event TBA'}

Tickets:
${ticketsList}

Total: €${ticketTotal.toFixed(2)}
Payment Method: ${paymentMethod}
Transaction ID: ${transactionId}
            `;

            // Send ticket confirmation email to customer
            await req.payload.sendEmail({
              to: customerData.email,
              from: `SHUSH <${process.env.SMTP_USER}>`,
              replyTo: 'SHUSH <hello@shush.dance>',
              subject: `Ticket Confirmation - ${ticketNumber}`,
              html: `
                <h2>SHUSH - Ticket Purchase Confirmation</h2>
                <p>Hi ${customerData.firstName},</p>
                <p>Thank you for purchasing tickets! Here are your ticket details:</p>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${ticketSummary}</pre>
                <p><strong>Important:</strong></p>
                <ul>
                  <li>Save this email as your ticket confirmation</li>
                  <li>Your name will be added to a list at the door</li>
                  <li>Be mindful and respectful of the venue and other attendees</li>
                </ul>
                <p>Thanks for supporting us and what we do. See you on the dance!</p>
                <p>- SHUSH crew</p>
              `,
            });

            // Send notification email to events team
            await req.payload.sendEmail({
              to: 'events@shush.dance',
              from: `SHUSH <${process.env.SMTP_USER}>`,
              replyTo: 'SHUSH <hello@shush.dance>',
              subject: `New Ticket Sale - ${ticketNumber}`,
              html: `
                <h2>New Ticket Sale</h2>
                <p>New tickets have been sold:</p>
                <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${ticketSummary}</pre>
                ${customerData.customerNotes ? `<p>Customer Notes: ${customerData.customerNotes}</p>` : ''}
              `,
            });
          } catch (emailError) {
            console.error('Failed to send ticket emails:', emailError);
            // Don't fail the ticket creation if emails fail
          }
        } catch (ticketSaleError) {
          console.error(
            'Failed to create ticket sale record:',
            ticketSaleError
          );
          // Continue with order creation even if ticket sale fails
        }
      }

      // Calculate per-item shipping and VAT proportionally for non-ticket items
      if (physicalItems.length > 0) {
        const totalItemsValue = physicalItems.reduce(
          (sum: number, item: any) => sum + item.lineTotal,
          0
        );

        for (const item of physicalItems) {
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
      }

      return res.status(200).json({
        success: true,
        order: order?.id || null,
        saleRecords: saleRecords,
        ticketSaleRecords: ticketSaleRecords,
        orderNumber,
        hasPhysicalItems: physicalItems.length > 0,
        hasTickets: ticketItems.length > 0,
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
