import type { Endpoint } from 'payload';
import Stripe from 'stripe';

import { validateAndNormalizeOrderData } from '../utils/validateOrderData';

// Cache Stripe instance with proper cleanup and health checks
let stripeInstance: Stripe | null = null;
let instanceCreatedAt: number = 0;
let instanceRequestCount: number = 0;
const INSTANCE_TTL = 10 * 60 * 1000; // 10 minutes (reduced from 30)
const MAX_REQUESTS_PER_INSTANCE = 100; // Force refresh after 100 requests

const cleanupStripeInstance = () => {
  if (stripeInstance) {
    try {
      // Clear any internal timers/connections if possible
      // Note: Stripe doesn't expose cleanup methods, but we can null the reference
      console.log('🧹 Cleaning up old Stripe instance');
      stripeInstance = null;
      instanceCreatedAt = 0;
      instanceRequestCount = 0;
    } catch (error) {
      console.error('⚠️ Error cleaning up Stripe instance:', error);
    }
  }
};

const getStripeInstance = (): Stripe => {
  const now = Date.now();
  const age = stripeInstance ? now - instanceCreatedAt : 0;

  // Force refresh if:
  // 1. Instance doesn't exist
  // 2. Instance is too old (TTL exceeded)
  // 3. Instance has processed too many requests
  const shouldRefresh =
    !stripeInstance ||
    age > INSTANCE_TTL ||
    instanceRequestCount >= MAX_REQUESTS_PER_INSTANCE;

  if (shouldRefresh) {
    console.log('🔄 Refreshing Stripe instance...', {
      exists: !!stripeInstance,
      age: `${Math.floor(age / 1000)}s`,
      ttl: `${INSTANCE_TTL / 1000}s`,
      requestCount: instanceRequestCount,
      maxRequests: MAX_REQUESTS_PER_INSTANCE,
      reason: !stripeInstance
        ? 'missing'
        : age > INSTANCE_TTL
          ? 'expired'
          : 'max-requests',
    });

    // Clean up old instance
    cleanupStripeInstance();

    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY missing from environment');
      throw new Error('STRIPE_SECRET_KEY environment variable is missing');
    }

    try {
      // Create fresh instance with aggressive settings
      stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
        maxNetworkRetries: 2, // Reduced from 3
        timeout: 8000, // Reduced from 10000
        telemetry: false, // Disable telemetry to reduce overhead
        appInfo: {
          name: 'SHUSH-Dance',
          version: '1.0.0',
        },
      });

      instanceCreatedAt = now;
      instanceRequestCount = 0;
      console.log('✅ Fresh Stripe instance created successfully');
    } catch (error: any) {
      console.error('❌ Failed to create Stripe instance:', error);
      throw new Error(`Failed to initialize Stripe: ${error.message}`);
    }
  }

  // Increment request counter
  instanceRequestCount++;

  return stripeInstance;
};

// Clean up Stripe instance on process exit
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, cleaning up Stripe instance...');
  cleanupStripeInstance();
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, cleaning up Stripe instance...');
  cleanupStripeInstance();
});

// Clean up on uncaught exceptions (though this should be rare)
process.on('uncaughtException', (error) => {
  console.error('🔥 Uncaught exception, cleaning up Stripe instance:', error);
  cleanupStripeInstance();
});

const createPaymentIntentWithRetry = async (
  paymentIntentData: Stripe.PaymentIntentCreateParams,
  maxRetries = 3,
  requestId = 'unknown',
  idempotencyKey?: string,
): Promise<Stripe.PaymentIntent> => {
  let stripe = getStripeInstance();

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[${requestId}] 🔄 Stripe API call attempt ${attempt}/${maxRetries} (instance age: ${Math.floor((Date.now() - instanceCreatedAt) / 1000)}s, requests: ${instanceRequestCount})`,
      );
      return await stripe.paymentIntents.create(paymentIntentData, {
        idempotencyKey,
      });
    } catch (error: any) {
      console.error(
        `[${requestId}] ❌ Payment intent creation attempt ${attempt}/${maxRetries} failed:`,
        {
          message: error.message,
          type: error.type,
          code: error.code,
          attempt,
          instanceAge: Math.floor((Date.now() - instanceCreatedAt) / 1000),
          instanceRequests: instanceRequestCount,
        },
      );

      // Check if this might be a stale instance issue
      const isConnectionError =
        error.code === 'ECONNRESET' ||
        error.code === 'ECONNREFUSED' ||
        error.code === 'ETIMEDOUT' ||
        error.message?.includes('timeout') ||
        error.message?.includes('connection');

      if (isConnectionError && attempt < maxRetries) {
        console.log(
          `[${requestId}] 🔄 Connection error detected, forcing fresh Stripe instance...`,
        );
        cleanupStripeInstance();
        stripe = getStripeInstance(); // Get fresh instance
      }

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
  handler: async (req) => {
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const clientIp =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      null;

    console.log(`[${requestId}] 🚀 Payment intent request started`, {
      userAgent: req.headers.get('user-agent'),
      ip: clientIp,
      origin: req.headers.get('origin'),
      referer: req.headers.get('referer'),
      contentType: req.headers.get('content-type'),
      contentLength: req.headers.get('content-length'),
      xForwardedFor: req.headers.get('x-forwarded-for'),
      xRealIp: req.headers.get('x-real-ip'),
      isMonitor: req.headers.get('user-agent')?.includes('SHUSH-Monitor'),
      timestamp: new Date().toISOString(),
    });

    try {
      // Validate environment first
      if (!process.env.STRIPE_SECRET_KEY) {
        console.error(
          `[${requestId}] ❌ STRIPE_SECRET_KEY not found in environment`,
        );
        return Response.json({
          error: 'Stripe configuration missing',
          requestId,
          timestamp: new Date().toISOString(),
        }, { status: 500 });
      }

      let requestBody: {
        amount?: unknown;
        customerData?: { email?: string };
        orderData?: { cartItems?: unknown[] };
      };
      try {
        requestBody = (await req.json()) as typeof requestBody;
      } catch {
        return Response.json(
          {
            error: 'Invalid JSON body',
            requestId,
            timestamp: new Date().toISOString(),
          },
          { status: 400 },
        );
      }
      const { amount, customerData, orderData } = requestBody;

      console.log(`[${requestId}] 📋 Request payload:`, {
        amount,
        hasCustomerData: !!customerData,
        hasOrderData: !!orderData,
        customerEmail: customerData?.email
          ? '***@' + customerData.email.split('@')[1]
          : 'missing',
        itemCount: orderData?.cartItems?.length || 0,
      });

      if (!orderData?.cartItems?.length) {
        return Response.json({
          error: 'Order data with cart items is required',
          code: 'missing_cart_items',
          requestId,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      let validatedOrderData;
      try {
        validatedOrderData = await validateAndNormalizeOrderData(
          req.payload,
          orderData as any,
        );
      } catch (validationError: any) {
        console.error(
          `[${requestId}] ❌ Order validation failed:`,
          validationError,
        );
        return Response.json({
          error: validationError.message || 'Invalid order data',
          code: 'cart_validation_failed',
          requestId,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      const validatedAmount = validatedOrderData.totals.total;
      const submittedAmount = Number(amount);
      if (
        !Number.isFinite(submittedAmount) ||
        Math.abs(submittedAmount - validatedAmount) > 0.02
      ) {
        return Response.json({
          error: 'Cart total is out of date. Please refresh your cart.',
          code: 'cart_validation_failed',
          requestId,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      // Validate required fields
      if (
        !validatedAmount ||
        typeof validatedAmount !== 'number' ||
        validatedAmount <= 0
      ) {
        console.error(`[${requestId}] ❌ Invalid amount:`, validatedAmount);
        return Response.json({
          error: 'Valid amount is required',
          requestId,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      if (
        !customerData ||
        customerData.email !== validatedOrderData.customerData.email
      ) {
        console.error(`[${requestId}] ❌ Customer data missing or invalid:`, {
          hasCustomerData: !!customerData,
          hasEmail: !!customerData?.email,
        });
        return Response.json({
          error: 'Valid customer data is required',
          requestId,
          timestamp: new Date().toISOString(),
        }, { status: 400 });
      }

      // Convert amount to cents and ensure it's an integer
      const amountInCents = Math.round(validatedAmount * 100);

      // Log if we're in test mode
      const isTestMode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_');

      console.log(
        `[${requestId}] 💳 Creating payment intent for ${validatedOrderData.currency} ${validatedAmount} (${amountInCents} cents) - ${isTestMode ? 'TEST' : 'LIVE'} mode`,
      );

      // Prepare metadata with order data split into chunks (500 char limit per key)
      const metadata: Record<string, string> = {
        customerEmail: validatedOrderData.customerData.email as string,
        customerName:
          `${validatedOrderData.customerData.firstName || ''} ${validatedOrderData.customerData.lastName || ''}`.trim(),
        testMode: isTestMode.toString(),
        requestId,
        timestamp: new Date().toISOString(),
      };

      // Split order data into chunks if it exists
      if (validatedOrderData) {
        const orderDataString = JSON.stringify(validatedOrderData);
        const chunkSize = 450; // Leave some buffer under 500 char limit

        console.log(
          `[${requestId}] 📦 Order data length: ${orderDataString.length} characters`,
        );

        if (orderDataString.length <= chunkSize) {
          metadata.orderData = orderDataString;
          console.log(
            `[${requestId}] ✅ Order data stored in single metadata key`,
          );
        } else {
          // Split into multiple chunks
          const chunks = [];
          for (let i = 0; i < orderDataString.length; i += chunkSize) {
            chunks.push(orderDataString.substring(i, i + chunkSize));
          }
          if (chunks.length > 44) {
            return Response.json({
              error: 'Cart contains too much data. Please reduce its size.',
              code: 'cart_too_large',
              requestId,
            }, { status: 400 });
          }

          // Store chunks in separate metadata keys
          chunks.forEach((chunk, index) => {
            metadata[`orderData_${index}`] = chunk;
          });
          metadata.orderDataChunks = chunks.length.toString();

          console.log(
            `[${requestId}] 📦 Order data split into ${chunks.length} chunks:`,
            chunks.map((chunk, i) => `chunk_${i}: ${chunk.length} chars`),
          );
        }
      }

      // Create payment intent data
      const paymentIntentData: Stripe.PaymentIntentCreateParams = {
        amount: amountInCents,
        currency: validatedOrderData.stripeCurrency,
        automatic_payment_methods: {
          enabled: true,
        },
        metadata,
      };

      console.log(`[${requestId}] 🔄 Attempting to create payment intent...`);

      // Create payment intent with retry logic
      const paymentIntent = await createPaymentIntentWithRetry(
        paymentIntentData,
        3,
        requestId,
        req.headers.get('idempotency-key')?.slice(0, 255) ?? undefined,
      );

      console.log(
        `[${requestId}] ✅ Payment intent created successfully: ${paymentIntent.id}`,
      );

      return Response.json({
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

      return Response.json(
        {
          error: 'Failed to create payment intent',
          details: error.message,
          type: error.type || 'unknown',
          code: error.code || 'unknown',
          requestId,
          timestamp: new Date().toISOString(),
        },
        { status: statusCode },
      );
    } finally {
      console.log(`[${requestId}] 🏁 Payment intent request completed`);
    }
  },
};
