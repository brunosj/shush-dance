import { Endpoint } from 'payload/config';
import Stripe from 'stripe';
import { processStripeOrderSuccess } from '../utils/processStripeOrder';
import { retrieveStripeProcessingFeeCents } from '../utils/stripeFees';
import { readValidatedOrderDataFromMetadata } from '../utils/validateOrderData';
import { importPaidCheckoutSession } from '../utils/importPaidCheckoutSession';

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

function hasCartOrderData(metadata: Stripe.Metadata | null | undefined): boolean {
  if (!metadata) return false;
  if (metadata.orderData) return true;
  if (metadata.orderDataChunks) return true;
  return false;
}

export const stripeWebhookEndpoint: Endpoint = {
  path: '/stripe-webhook',
  method: 'post',
  handler: async (req, res) => {
    console.log('🎯 Stripe webhook received');

    const isLocalDev =
      process.env.NODE_ENV !== 'production' ||
      process.env.PAYLOAD_PUBLIC_SERVER_URL?.includes('localhost') ||
      process.env.PAYLOAD_PUBLIC_SERVER_URL?.includes('127.0.0.1');

    let event: Stripe.Event;

    if (isLocalDev) {
      console.log(
        '🚧 Development mode: processing webhook without signature verification'
      );
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
    } else {
      const sig = req.headers['stripe-signature'];
      const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

      if (!sig || !endpointSecret) {
        console.error('Missing Stripe signature or webhook secret');
        return res.status(400).json({ error: 'Missing webhook configuration' });
      }

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
    }

    try {
      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        if (!hasCartOrderData(paymentIntent.metadata)) {
          // Payment Link / Checkout PIs have no onsite cart metadata —
          // those are imported via checkout.session.completed (+ cron).
          console.log(
            `⏭ Skipping payment_intent.succeeded ${paymentIntent.id} (no cart orderData)`
          );
        } else {
          console.log(
            '💳 Processing payment_intent.succeeded:',
            paymentIntent.id
          );
          await processPaymentSuccess(paymentIntent, req);
        }
      } else if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;
        console.log('🧾 Processing checkout.session.completed:', session.id);
        await processCheckoutSessionCompleted(session, req);
      }
    } catch (error: any) {
      console.error('❌ Error processing webhook event:', error);
      return res.status(500).json({ error: error.message });
    }

    return res.json({ received: true });
  },
};

async function processCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
  req: any
) {
  const stripe = getStripeInstance();
  // Re-fetch so line items / customer fields are complete.
  const full = await stripe.checkout.sessions.retrieve(session.id);
  const result = await importPaidCheckoutSession(req.payload, stripe, full);
  if (result.status === 'created') {
    console.log(
      `🎉 Checkout session ${result.sessionId} imported as ticket sale (${result.transactionId})`
    );
  } else if (result.status === 'skipped') {
    console.log(
      `⏭ Checkout session ${result.sessionId} skipped: ${result.reason}`
    );
  } else {
    throw new Error(`Checkout import failed: ${result.error}`);
  }
}

async function processPaymentSuccess(
  paymentIntent: Stripe.PaymentIntent,
  req: any
) {
  const orderData = readValidatedOrderDataFromMetadata(paymentIntent.metadata);
  const expectedAmount = Math.round(orderData.totals.total * 100);
  if (
    paymentIntent.currency !== orderData.stripeCurrency ||
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

  let stripeFeeEuros: number | null = null;
  try {
    const feeCents = await retrieveStripeProcessingFeeCents(
      stripe,
      paymentIntent.id
    );
    if (feeCents !== null) {
      stripeFeeEuros = feeCents / 100;
      console.log(
        `💳 Stripe fee for ${paymentIntent.id}: €${stripeFeeEuros.toFixed(2)}`
      );
    } else {
      console.warn(
        `⚠️ Stripe fee not available yet for ${paymentIntent.id}; will retry via fallback if needed`
      );
    }
  } catch (error) {
    console.warn('Could not retrieve Stripe processing fee:', error);
  }

  await processStripeOrderSuccess(
    req.payload,
    paymentIntent.id,
    orderData,
    detectedPaymentMethod,
    orderNumber,
    { stripeFeeEuros }
  );

  console.log('🎉 Webhook processing completed successfully');
}
