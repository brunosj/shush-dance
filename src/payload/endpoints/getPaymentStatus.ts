import type { Endpoint } from 'payload/config';
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
  handler: async (req, res) => {
    try {
      const paymentIntentId = req.query.payment_intent;

      if (
        typeof paymentIntentId !== 'string' ||
        !PAYMENT_INTENT_ID_PATTERN.test(paymentIntentId)
      ) {
        return res.status(400).json({
          error: 'Invalid or missing payment_intent parameter',
        });
      }

      if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({
          error: 'Payment verification is not configured',
        });
      }

      const stripe = getStripeInstance();
      const paymentIntent =
        await stripe.paymentIntents.retrieve(paymentIntentId);

      return res.status(200).json({
        status: paymentIntent.status,
        succeeded: paymentIntent.status === 'succeeded',
      });
    } catch (error) {
      console.error('❌ Failed to retrieve payment status:', error);
      return res.status(500).json({
        error: 'Failed to verify payment status',
      });
    }
  },
};
