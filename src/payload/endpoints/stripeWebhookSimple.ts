import { Endpoint } from 'payload/config';
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;
const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      maxNetworkRetries: 3,
      timeout: 10000,
    });
  }
  return stripeInstance;
};

export const stripeWebhookEndpoint: Endpoint = {
  path: '/stripe-webhook',
  method: 'post',
  handler: async (req, res) => {
    console.log('🎯 Stripe webhook received');

    // For development, skip signature verification and just process the event
    if (process.env.NODE_ENV === 'development') {
      console.log(
        '🚧 Development mode: processing webhook without signature verification'
      );

      let event: Stripe.Event;
      try {
        event = req.body as Stripe.Event;
      } catch (error) {
        console.error('❌ Failed to parse webhook body:', error);
        return res.status(400).json({ error: 'Invalid webhook body' });
      }

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        console.log(
          '💳 Processing payment_intent.succeeded:',
          paymentIntent.id
        );

        try {
          await processPaymentSuccess(paymentIntent, req);
          return res.json({ received: true });
        } catch (error: any) {
          console.error('❌ Error processing payment:', error);
          return res.status(500).json({ error: error.message });
        }
      }

      return res.json({ received: true });
    }

    // Production signature verification
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return res.status(400).json({ error: 'Missing webhook configuration' });
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripeInstance();
      const rawBody =
        typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      event = stripe.webhooks.constructEvent(rawBody, sig, endpointSecret);
      console.log('✅ Webhook signature verified:', event.type);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      try {
        await processPaymentSuccess(paymentIntent, req);
      } catch (error: any) {
        console.error('❌ Error processing payment:', error);
        return res.status(500).json({ error: error.message });
      }
    }

    res.json({ received: true });
  },
};

async function processPaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  req: any
) {
  // Extract order data from metadata
  const metadata = paymentIntent.metadata;
  let orderDataString = '';

  if (metadata.orderData) {
    orderDataString = metadata.orderData;
  } else if (metadata.orderDataChunks) {
    const chunkCount = parseInt(metadata.orderDataChunks);
    for (let i = 0; i < chunkCount; i++) {
      orderDataString += metadata[`orderData_${i}`] || '';
    }
  }

  if (!orderDataString) {
    throw new Error('No order data found in payment intent metadata');
  }

  const orderData = JSON.parse(orderDataString);
  const orderNumber = `SHUSH-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Determine payment method
  const stripe = getStripeInstance();
  let paymentMethodType = 'unknown';
  try {
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

  // Separate items
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

  // Create online order for physical items
  if (physicalItems.length > 0) {
    const order = await req.payload.create({
      collection: 'online-orders',
      data: {
        orderNumber,
        status: 'pending',
        paymentMethod: detectedPaymentMethod,
        paymentStatus: 'paid',
        transactionId: paymentIntent.id,
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

    console.log('✅ Created online order:', order.id);

    // Send emails for physical items
    await sendOrderEmails(
      physicalItems,
      orderData,
      orderNumber,
      detectedPaymentMethod,
      paymentIntent.id,
      req
    );
  }

  // Create ticket sales
  if (ticketItems.length > 0) {
    const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ticketSubtotal =
      ticketItems.reduce((sum: number, item: any) => sum + item.lineTotal, 0) /
      100;

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
        transactionId: paymentIntent.id,
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
        eventTitle: eventMetadata.eventTitle || firstTicket?.parentItem || null,
        customerNotes: orderData.customerData.customerNotes || '',
      },
    });

    console.log('✅ Created ticket sale:', ticketSale.id);

    // Send ticket emails
    await sendTicketEmails(
      ticketItems,
      orderData,
      ticketNumber,
      detectedPaymentMethod,
      paymentIntent.id,
      req
    );
  }

  // Create sale records
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
            bandcampTransactionId: paymentIntent.id,
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

  console.log('🎉 Webhook processing completed successfully');
}

async function sendOrderEmails(
  physicalItems: any[],
  orderData: any,
  orderNumber: string,
  paymentMethod: string,
  transactionId: string,
  req: any
) {
  const itemsList = physicalItems
    .map(
      (item: any) =>
        `• ${item.name} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`
    )
    .join('\n');

  const physicalSubtotal =
    physicalItems.reduce((sum: number, item: any) => sum + item.lineTotal, 0) /
    100;
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

  // Send confirmation email to customer
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
      <p>Transaction ID: ${transactionId}</p>
    `,
  });
}

async function sendTicketEmails(
  ticketItems: any[],
  orderData: any,
  ticketNumber: string,
  paymentMethod: string,
  transactionId: string,
  req: any
) {
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
Payment Method: ${paymentMethod}
Transaction ID: ${transactionId}
  `;

  // Send ticket confirmation email to customer
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
    `,
  });
}
