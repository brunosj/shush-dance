import { Endpoint } from 'payload/config';
import Stripe from 'stripe';

export const createPaymentIntentEndpoint: Endpoint = {
  path: '/create-payment-intent',
  method: 'post',
  handler: async (req, res) => {
    try {
      // Check environment variable
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY not found');
        return res.status(500).json({
          error: 'Stripe configuration missing',
        });
      }

      // Log if we're in test mode
      const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

      // Initialize Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

      const { amount, currency = 'eur', customerData } = req.body;

      // Validate required fields
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        console.error('Invalid amount:', amount);
        return res.status(400).json({
          error: 'Valid amount is required',
        });
      }

      // Convert amount to cents and ensure it's an integer
      const amountInCents = Math.round(amount * 100);

      // Create payment intent
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: currency.toLowerCase(),
        metadata: {
          customerEmail: customerData?.email || '',
          customerName:
            `${customerData?.firstName || ''} ${customerData?.lastName || ''}`.trim(),
          testMode: isTestMode.toString(),
        },
      };

      // For test mode, use simpler configuration
      if (isTestMode) {
        paymentIntentData.automatic_payment_methods = {
          enabled: true,
        };
      } else {
        paymentIntentData.automatic_payment_methods = {
          enabled: true,
        };
      }

      const paymentIntent =
        await stripe.paymentIntents.create(paymentIntentData);

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error('Stripe payment intent error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        stack: error.stack,
      });

      return res.status(500).json({
        error: 'Failed to create payment intent',
        details: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown',
      });
    }
  },
};
