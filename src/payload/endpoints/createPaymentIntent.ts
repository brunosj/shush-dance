import { Endpoint } from 'payload/config';
import Stripe from 'stripe';

// Cache Stripe instance to avoid creating new ones on every request
let stripeInstance: Stripe | null = null;

const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY environment variable is missing');
    }

    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 3,
      timeout: 10000, // 10 second timeout
    });
  }
  return stripeInstance;
};

const createPaymentIntentWithRetry = async (
  paymentIntentData: Stripe.PaymentIntentCreateParams,
  maxRetries = 3
): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripeInstance();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await stripe.paymentIntents.create(paymentIntentData);
    } catch (error: any) {
      console.error(
        `Payment intent creation attempt ${attempt}/${maxRetries} failed:`,
        {
          message: error.message,
          type: error.type,
          code: error.code,
          attempt,
        }
      );

      // Don't retry on client errors (4xx)
      if (
        error.statusCode &&
        error.statusCode >= 400 &&
        error.statusCode < 500
      ) {
        throw error;
      }

      // If this was the last attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }

      // Wait before retrying (exponential backoff)
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
};

export const createPaymentIntentEndpoint: Endpoint = {
  path: '/create-payment-intent',
  method: 'post',
  handler: async (req, res) => {
    try {
      // Validate environment first
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error('STRIPE_SECRET_KEY not found in environment');
        return res.status(500).json({
          error: 'Stripe configuration missing',
          timestamp: new Date().toISOString(),
        });
      }

      const { amount, currency = 'eur', customerData } = req.body;

      // Validate required fields
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        console.error('Invalid amount:', amount);
        return res.status(400).json({
          error: 'Valid amount is required',
          timestamp: new Date().toISOString(),
        });
      }

      if (!customerData || !customerData.email) {
        console.error('Customer data missing or invalid');
        return res.status(400).json({
          error: 'Valid customer data is required',
          timestamp: new Date().toISOString(),
        });
      }

      // Convert amount to cents and ensure it's an integer
      const amountInCents = Math.round(amount * 100);

      // Log if we're in test mode
      const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

      console.log(
        `Creating payment intent for €${amount} (${amountInCents} cents) - ${isTestMode ? 'TEST' : 'LIVE'} mode`
      );

      // Create payment intent data
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: currency.toLowerCase(),
        automatic_payment_methods: {
          enabled: true,
        },
        metadata: {
          customerEmail: customerData.email,
          customerName:
            `${customerData.firstName || ''} ${customerData.lastName || ''}`.trim(),
          testMode: isTestMode.toString(),
          timestamp: new Date().toISOString(),
        },
      };

      // Create payment intent with retry logic
      const paymentIntent =
        await createPaymentIntentWithRetry(paymentIntentData);

      console.log(`Payment intent created successfully: ${paymentIntent.id}`);

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error('Stripe payment intent error details:', {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
        timestamp: new Date().toISOString(),
      });

      // Determine appropriate status code
      let statusCode = 500;
      if (error.statusCode) {
        statusCode = error.statusCode;
      } else if (error.type === 'StripeCardError') {
        statusCode = 400;
      } else if (error.type === 'StripeInvalidRequestError') {
        statusCode = 400;
      }

      return res.status(statusCode).json({
        error: 'Failed to create payment intent',
        details: error.message,
        type: error.type || 'unknown',
        code: error.code || 'unknown',
        timestamp: new Date().toISOString(),
      });
    }
  },
};
