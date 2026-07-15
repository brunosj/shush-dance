import { Endpoint } from 'payload/config';
import Stripe from 'stripe';
import { processStripeOrderSuccess } from '../utils/processStripeOrder';
import { readValidatedOrderDataFromMetadata } from '../utils/validateOrderData';

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

    const isLocalDev =
      process.env.NODE_ENV !== 'production' ||
      process.env.PAYLOAD_PUBLIC_SERVER_URL?.includes('localhost') ||
      process.env.PAYLOAD_PUBLIC_SERVER_URL?.includes('127.0.0.1');

    if (isLocalDev) {
      console.log(
        '🚧 Development mode: processing webhook without signature verification'
      );

      let event: Stripe.Event;
      try {
        const raw = Buffer.isBuffer(req.body)
          ? req.body.toString('utf8')
          : typeof req.body === 'string'
            ? req.body
            : JSON.stringify(req.body);
        event = JSON.parse(raw) as Stripe.Event;
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

    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!sig || !endpointSecret) {
      console.error('Missing Stripe signature or webhook secret');
      return res.status(400).json({ error: 'Missing webhook configuration' });
    }

    let event: Stripe.Event;
    try {
      const stripe = getStripeInstance();
      const rawBody = Buffer.isBuffer(req.body)
        ? req.body
        : typeof req.body === 'string'
          ? req.body
          : JSON.stringify(req.body);
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
  const orderData = readValidatedOrderDataFromMetadata(paymentIntent.metadata);
  const expectedAmount = Math.round(orderData.totals.total * 100);
  if (
    paymentIntent.currency !== 'eur' ||
    paymentIntent.amount_received !== expectedAmount
  ) {
    throw new Error('Paid amount or currency does not match validated order');
  }
  const orderNumber = `SHUSH-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

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

  await processStripeOrderSuccess(
    req.payload,
    paymentIntent.id,
    orderData,
    detectedPaymentMethod,
    orderNumber
  );

  console.log('🎉 Webhook processing completed successfully');
}
