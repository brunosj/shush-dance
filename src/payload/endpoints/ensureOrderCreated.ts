import { Endpoint } from 'payload/config';
import Stripe from 'stripe';
import {
  fetchEventFooterHtml,
  renderEventFooterSection,
} from '../utils/ticketEmailFooter';

let stripeInstance: Stripe | null = null;
const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2025-08-27.basil',
      maxNetworkRetries: 3,
      timeout: 10000,
    });
  }
  return stripeInstance;
};

async function findExistingOrderByPaymentIntent(
  payload: any,
  paymentIntentId: string
): Promise<boolean> {
  const [existingOnlineOrders, existingTicketSales] = await Promise.all([
    payload.find({
      collection: 'online-orders',
      where: {
        transactionId: {
          equals: paymentIntentId,
        },
      },
      limit: 1,
    }),
    payload.find({
      collection: 'ticket-sales',
      where: {
        transactionId: {
          equals: paymentIntentId,
        },
      },
      limit: 1,
    }),
  ]);

  return (
    existingOnlineOrders.docs.length > 0 || existingTicketSales.docs.length > 0
  );
}

async function waitForWebhookOrder(
  payload: any,
  paymentIntentId: string,
  maxAttempts = 6,
  delayMs = 1500
): Promise<boolean> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    if (await findExistingOrderByPaymentIntent(payload, paymentIntentId)) {
      console.log(
        `✅ Webhook already processed order for ${paymentIntentId} (attempt ${attempt}/${maxAttempts})`
      );
      return true;
    }

    if (attempt < maxAttempts) {
      console.log(
        `⏳ Waiting for webhook to create order (${attempt}/${maxAttempts})...`
      );
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return false;
}

export const ensureOrderCreatedEndpoint: Endpoint = {
  path: '/ensure-order-created',
  method: 'post',
  handler: async (req, res) => {
    try {
      const { paymentIntentId, orderData } = req.body;

      if (!paymentIntentId || !orderData) {
        return res.status(400).json({
          error: 'Payment intent ID and order data required',
        });
      }

      console.log(
        `🔍 Fallback: Checking if order exists for payment intent: ${paymentIntentId}`
      );

      // Poll briefly — the success page waits 4s first, but a slow webhook
      // may still be processing when this endpoint is called.
      const orderExists = await waitForWebhookOrder(
        req.payload,
        paymentIntentId
      );

      if (orderExists) {
        return res.json({
          success: true,
          message: 'Order already exists',
          webhookWorked: true,
        });
      }

      console.log(
        `⚠️ No order found for ${paymentIntentId}, creating fallback order...`
      );

      const isLocalDev =
        process.env.NODE_ENV !== 'production' ||
        process.env.PAYLOAD_PUBLIC_SERVER_URL?.includes('localhost') ||
        process.env.PAYLOAD_PUBLIC_SERVER_URL?.includes('127.0.0.1');

      if (isLocalDev) {
        console.log(
          '💡 Local dev tip: run `stripe listen --forward-to localhost:3000/api/stripe-webhook` so the webhook creates orders instead of this fallback.'
        );
      }

      // Get payment method + status from Stripe
      const stripe = getStripeInstance();
      let paymentMethodType = 'unknown';

      try {
        const paymentIntent =
          await stripe.paymentIntents.retrieve(paymentIntentId);

        // Only create records for genuinely completed payments. Async /
        // redirect-based methods (e.g. Klarna) can still be `processing` when
        // the success page runs this fallback; creating a "paid" record then
        // would be premature. The webhook will handle it on
        // `payment_intent.succeeded`.
        if (paymentIntent.status !== 'succeeded') {
          console.log(
            `⏳ Fallback skipped: payment intent ${paymentIntentId} status is "${paymentIntent.status}" (not succeeded). Webhook will process it once completed.`
          );
          return res.json({
            success: true,
            message: `Payment not yet completed (status: ${paymentIntent.status}); deferring to webhook`,
            webhookWorked: true,
            deferred: true,
          });
        }

        if (paymentIntent.payment_method) {
          const paymentMethod = await stripe.paymentMethods.retrieve(
            paymentIntent.payment_method as string
          );
          paymentMethodType = paymentMethod.type;
        }
      } catch (error) {
        console.warn('Could not retrieve payment method details:', error);
      }

      const detectedPaymentMethod =
        paymentMethodType === 'paypal' ? 'paypal' : 'stripe';
      const orderNumber = `SHUSH-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      // Separate ticket and physical items
      const ticketItems = orderData.cartItems.filter(
        (item: any) =>
          item.type === 'ticket' ||
          (item.metadata && item.metadata.type === 'ticket')
      );
      const physicalItems = orderData.cartItems.filter(
        (item: any) =>
          item.type !== 'ticket' &&
          (!item.metadata || item.metadata.type !== 'ticket')
      );

      // Create orders using the same logic as the webhook
      if (physicalItems.length > 0) {
        const order = await req.payload.create({
          collection: 'online-orders',
          data: {
            orderNumber,
            status: 'pending',
            paymentMethod: detectedPaymentMethod,
            paymentStatus: 'paid',
            transactionId: paymentIntentId,
            customerEmail: orderData.customerData.email,
            customerPhone: orderData.customerData.phone || '',
            firstName: orderData.customerData.firstName,
            lastName: orderData.customerData.lastName,
            shippingAddress: {
              street: orderData.customerData.street || '',
              city: orderData.customerData.city || '',
              postalCode: orderData.customerData.postalCode || '',
              country: orderData.customerData.country || '',
              shippingRegion: orderData.shippingRegion,
            },
            items: physicalItems.map((item: any) => ({
              product: null,
              quantity: item.quantity,
              unitPrice: item.unitPrice / 100,
              lineTotal: item.lineTotal / 100,
              cartItemId: item.id,
              cartItemName: item.name,
              cartItemDescription: item.description,
            })),
            orderTotals: orderData.totals,
            customerNotes: orderData.customerData.customerNotes || '',
          },
        });
        console.log('✅ Fallback: Created online order:', order.id);
      }

      if (ticketItems.length > 0) {
        const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const ticketSubtotal =
          ticketItems.reduce(
            (sum: number, item: any) => sum + item.lineTotal,
            0
          ) / 100;

        const firstTicket = ticketItems[0];
        const eventMetadata = firstTicket?.metadata || {};

        const ticketSale = await req.payload.create({
          collection: 'ticket-sales',
          data: {
            ticketNumber,
            status: 'active',
            event: eventMetadata.eventId || null,
            ticketTier: firstTicket?.name || 'General Admission',
            paymentMethod: detectedPaymentMethod,
            paymentStatus: 'paid',
            transactionId: paymentIntentId,
            customerEmail: orderData.customerData.email,
            customerPhone: orderData.customerData.phone || '',
            firstName: orderData.customerData.firstName,
            lastName: orderData.customerData.lastName,
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
              vat: 0,
              total: ticketSubtotal,
            },
            eventDate: eventMetadata.eventDate || null,
            eventLocation: eventMetadata.eventLocation || null,
            eventTitle:
              eventMetadata.eventTitle || firstTicket?.parentItem || null,
            customerNotes: orderData.customerData.customerNotes || '',
          },
        });
        console.log('✅ Fallback: Created ticket sale:', ticketSale.id);
      }

      // Create sales records
      if (physicalItems.length > 0) {
        const totalItemsValue = physicalItems.reduce(
          (sum: number, item: any) => sum + item.lineTotal,
          0
        );

        for (const item of physicalItems) {
          try {
            const itemProportion = item.lineTotal / totalItemsValue;
            const itemShipping = orderData.totals.shipping * itemProportion;
            const itemVAT = orderData.totals.vat * itemProportion;

            await req.payload.create({
              collection: 'sales',
              data: {
                itemName: item.name,
                type: item.type === 'release' ? 'record' : 'merch',
                pointOfSale:
                  detectedPaymentMethod === 'stripe' ? 'stripe' : 'paypal',
                soldAt: new Date().toISOString(),
                itemPrice: item.unitPrice / 100,
                quantity: item.quantity,
                currency: 'EUR',
                subTotal: item.lineTotal / 100,
                shipping: itemShipping,
                sellerTax: itemVAT,
                netAmount: item.lineTotal / 100 + itemShipping + itemVAT,
                buyerEmail: orderData.customerData.email,
                bandcampTransactionId: paymentIntentId,
                regionOrState: orderData.shippingRegion,
              },
            });
          } catch (saleError) {
            console.error(
              `Failed to create sale record for ${item.name}:`,
              saleError
            );
          }
        }
      }

      // Send emails (same as webhook)
      await sendFallbackEmails(
        physicalItems,
        ticketItems,
        orderData,
        orderNumber,
        paymentIntentId,
        req
      );

      console.log('🎉 Fallback order creation completed successfully');

      return res.json({
        success: true,
        message: 'Fallback order created successfully',
        webhookWorked: false,
      });
    } catch (error: any) {
      console.error('❌ Fallback order creation failed:', error);
      return res.status(500).json({
        error: 'Failed to ensure order creation',
        details: error.message,
      });
    }
  },
};

async function sendFallbackEmails(
  physicalItems: any[],
  ticketItems: any[],
  orderData: any,
  orderNumber: string,
  paymentIntentId: string,
  req: any
) {
  // Send physical order emails
  if (physicalItems.length > 0) {
    const itemsList = physicalItems
      .map(
        (item: any) =>
          `• ${item.name} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`
      )
      .join('\n');

    const physicalSubtotal =
      physicalItems.reduce(
        (sum: number, item: any) => sum + item.lineTotal,
        0
      ) / 100;
    const physicalTotal =
      physicalSubtotal + orderData.totals.shipping + orderData.totals.vat;

    const orderSummary = `
Order Number: ${orderNumber}
Customer: ${orderData.customerData.firstName} ${orderData.customerData.lastName}
Email: ${orderData.customerData.email}

Items:
${itemsList}

Subtotal: €${physicalSubtotal.toFixed(2)}
Shipping: €${orderData.totals.shipping.toFixed(2)}
VAT: €${orderData.totals.vat.toFixed(2)}
Total: €${physicalTotal.toFixed(2)}

Shipping Address:
${orderData.customerData.firstName} ${orderData.customerData.lastName}
${orderData.customerData.street}
${orderData.customerData.city}, ${orderData.customerData.postalCode}
${orderData.customerData.country}
    `;

    await req.payload.sendEmail({
      to: orderData.customerData.email,
      from: `SHUSH <${process.env.SMTP_USER}>`,
      replyTo: 'SHUSH <hello@shush.dance>',
      subject: `Order Confirmation - ${orderNumber}`,
      html: `
        <h2>Thank you for your order!</h2>
        <p>Hi ${orderData.customerData.firstName},</p>
        <p>We've received your order and it's being processed. Here are the details:</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${orderSummary}</pre>
        <p>We'll notify you by email when your order is shipped.</p>
        <p>Thanks for supporting us and what we do!</p>
        <p>- SHUSH crew</p>
      `,
    });

    await req.payload.sendEmail({
      to: 'hello@shush.dance',
      from: `SHUSH <${process.env.SMTP_USER}>`,
      replyTo: 'SHUSH <hello@shush.dance>',
      subject: `New Order (Fallback) - ${orderNumber}`,
      html: `
        <h2>New Order Received (Fallback Processing)</h2>
        <p>A new order has been created via fallback mechanism:</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${orderSummary}</pre>
        <p><strong>Note:</strong> This order was created via fallback - webhook may have failed.</p>
        <p>Transaction ID: ${paymentIntentId}</p>
      `,
    });
  }

  // Send ticket emails
  if (ticketItems.length > 0) {
    const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ticketsList = ticketItems
      .map(
        (item: any) =>
          `• ${item.name} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`
      )
      .join('\n');

    const ticketTotal =
      ticketItems.reduce((sum: number, item: any) => sum + item.lineTotal, 0) /
      100;

    const ticketSummary = `
Ticket Number: ${ticketNumber}
Customer: ${orderData.customerData.firstName} ${orderData.customerData.lastName}
Email: ${orderData.customerData.email}
Event: ${ticketItems[0]?.parentItem || 'Event TBA'}

Tickets:
${ticketsList}

Total: €${ticketTotal.toFixed(2)}
Transaction ID: ${paymentIntentId}
    `;

    const eventFooterHtml = await fetchEventFooterHtml(
      req,
      ticketItems[0]?.metadata?.eventId
    );

    await req.payload.sendEmail({
      to: orderData.customerData.email,
      from: `SHUSH <${process.env.SMTP_USER}>`,
      replyTo: 'SHUSH <hello@shush.dance>',
      subject: `Ticket Confirmation - ${ticketNumber}`,
      html: `
        <h2>SHUSH - Ticket Purchase Confirmation</h2>
        <p>Hi ${orderData.customerData.firstName},</p>
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
        ${renderEventFooterSection(eventFooterHtml)}
      `,
    });

    await req.payload.sendEmail({
      to: 'events@shush.dance',
      from: `SHUSH <${process.env.SMTP_USER}>`,
      replyTo: 'SHUSH <hello@shush.dance>',
      subject: `New Ticket Sale (Fallback) - ${ticketNumber}`,
      html: `
        <h2>New Ticket Sale (Fallback Processing)</h2>
        <p>New tickets have been sold via fallback mechanism:</p>
        <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${ticketSummary}</pre>
        <p><strong>Note:</strong> This ticket sale was created via fallback - webhook may have failed.</p>
      `,
    });
  }
}
