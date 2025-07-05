import { Endpoint } from 'payload/config';
import Stripe from 'stripe';

// Cache Stripe instance to avoid creating new ones on every request
let stripeInstance: Stripe | null = null;
let instanceCreatedAt: number = 0;
const INSTANCE_TTL = 30 * 60 * 1000; // 30 minutes

const getStripeInstance = (): Stripe => {
  const now = Date.now();

  // Refresh instance if it's too old or doesn't exist
  if (!stripeInstance || now - instanceCreatedAt > INSTANCE_TTL) {
    console.log('Creating new Stripe instance...', {
      exists: !!stripeInstance,
      age: stripeInstance ? now - instanceCreatedAt : 0,
      ttl: INSTANCE_TTL,
    });

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY missing from environment');
      throw new Error('STRIPE_SECRET_KEY environment variable is missing');
    }

    try {
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        maxNetworkRetries: 3,
        timeout: 10000, // 10 second timeout
      });
      instanceCreatedAt = now;
      console.log('✅ Stripe instance created successfully');
    } catch (error: any) {
      console.error('❌ Failed to create Stripe instance:', error);
      throw new Error(`Failed to initialize Stripe: ${error.message}`);
    }
  }

  return stripeInstance;
};

const createPaymentIntentWithRetry = async (
  paymentIntentData: Stripe.PaymentIntentCreateParams,
  maxRetries = 3,
  requestId = 'unknown'
): Promise<Stripe.PaymentIntent> => {
  const stripe = getStripeInstance();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[${requestId}] 🔄 Stripe API call attempt ${attempt}/${maxRetries}`
      );
      return await stripe.paymentIntents.create(paymentIntentData);
    } catch (error: any) {
      console.error(
        `[${requestId}] ❌ Payment intent creation attempt ${attempt}/${maxRetries} failed:`,
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
      console.log(`[${requestId}] ⏱️ Waiting ${delay}ms before retry...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error('Max retries exceeded');
};

export const createPaymentIntentEndpoint: Endpoint = {
  path: '/create-payment-intent',
  method: 'post',
  handler: async (req, res) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    console.log(`[${requestId}] 🚀 Payment intent request started`, {
      userAgent: req.headers['user-agent'],
      ip: req.ip || req.connection?.remoteAddress,
      timestamp: new Date().toISOString(),
    });

    try {
      // Validate environment first
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error(
          `[${requestId}] ❌ STRIPE_SECRET_KEY not found in environment`
        );
        return res.status(500).json({
          error: 'Stripe configuration missing',
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      const { amount, currency = 'eur', customerData } = req.body;

      console.log(`[${requestId}] 📋 Request payload:`, {
        amount,
        currency,
        hasCustomerData: !!customerData,
        customerEmail: customerData?.email
          ? '***@' + customerData.email.split('@')[1]
          : 'missing',
      });

      // Validate required fields
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        console.error(`[${requestId}] ❌ Invalid amount:`, amount);
        return res.status(400).json({
          error: 'Valid amount is required',
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      if (!customerData || !customerData.email) {
        console.error(`[${requestId}] ❌ Customer data missing or invalid:`, {
          hasCustomerData: !!customerData,
          hasEmail: !!customerData?.email,
        });
        return res.status(400).json({
          error: 'Valid customer data is required',
          requestId,
          timestamp: new Date().toISOString(),
        });
      }

      // Convert amount to cents and ensure it's an integer
      const amountInCents = Math.round(amount * 100);

      // Log if we're in test mode
      const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

      console.log(
        `[${requestId}] 💳 Creating payment intent for €${amount} (${amountInCents} cents) - ${isTestMode ? 'TEST' : 'LIVE'} mode`
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
          requestId,
          timestamp: new Date().toISOString(),
        },
      };

      console.log(`[${requestId}] 🔄 Attempting to create payment intent...`);

      // Create payment intent with retry logic
      const paymentIntent = await createPaymentIntentWithRetry(
        paymentIntentData,
        3,
        requestId
      );

      console.log(
        `[${requestId}] ✅ Payment intent created successfully: ${paymentIntent.id}`
      );

      return res.status(200).json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
        requestId,
        timestamp: new Date().toISOString(),
      });
    } catch (error: any) {
      console.error(`[${requestId}] ❌ Stripe payment intent error details:`, {
        message: error.message,
        type: error.type,
        code: error.code,
        statusCode: error.statusCode,
        stack: error.stack,
        requestId,
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        memoryUsage: process.memoryUsage(),
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
        requestId,
        timestamp: new Date().toISOString(),
      });
    } finally {
      console.log(`[${requestId}] 🏁 Payment intent request completed`);
    }
  },
};
