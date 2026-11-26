import type { Endpoint } from 'payload';
import Stripe from 'stripe';

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

const PAYMENT_INTENT_ID_PATTERN = /^pi_[a-zA-Z0-9]+$/;

export const getPaymentStatusEndpoint: Endpoint = {
  path: '/payment-status',
  method: 'get',
  handler: async (req) => {
    try {
      const paymentIntentId = req.searchParams.get('payment_intent');

      if (
        typeof paymentIntentId !== 'string' ||
        !PAYMENT_INTENT_ID_PATTERN.test(paymentIntentId)
      ) {
        return Response.json({
          error: 'Invalid or missing payment_intent parameter',
        }, { status: 400 });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return Response.json({
          error: 'Payment verification is not configured',
        }, { status: 500 });
      }

      const stripe = getStripeInstance();
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      return Response.json({
        status: paymentIntent.status,
        succeeded: paymentIntent.status === 'succeeded',
      });
    } catch (error) {
      console.error('❌ Failed to retrieve payment status:', error);
      return Response.json({
        error: 'Failed to verify payment status',
      }, { status: 500 });
    }
  },
};
