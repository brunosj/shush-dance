import { Endpoint } from 'payload/config';

interface MonitoringResult {
  timestamp: string;
  health: {
    uptime: string;
    memory: any;
    nodeVersion: string;
    hasStripeKey: boolean;
    stripeKeyPrefix: string;
    pid: number;
    platform: string;
    arch: string;
  };
  stripe: { success: boolean; error?: string; paymentIntentId?: string };
  order: { success: boolean; error?: string; orderNumber?: string };
  overall: boolean;
}

// Get server health metrics
const getServerHealth = () => {
  const memoryUsage = process.memoryUsage();
  const uptime = process.uptime();

  return {
    uptime: `${Math.floor(uptime)}s`,
    memory: {
      used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
      external: `${Math.round(memoryUsage.external / 1024 / 1024)}MB`,
    },
    nodeVersion: process.version,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    stripeKeyPrefix:
      process.env.STRIPE_SECRET_KEY?.substring(0, 8) || 'missing',
    pid: process.pid,
    platform: process.platform,
    arch: process.arch,
  };
};

// Test Stripe payment intent creation with enhanced error handling
const testStripePaymentIntent = async (): Promise<{
  success: boolean;
  error?: string;
  paymentIntentId?: string;
}> => {
  const testId = `monitor-${Date.now()}`;

  try {
    console.log(`[${testId}] 🧪 Testing Stripe payment intent creation...`);

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY not configured');
    }

    const Stripe = require('stripe');
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 2,
      timeout: 10000, // 10 second timeout
    });

    const testCustomerData = {
      email: 'monitor@shush.dance',
      firstName: 'Monitor',
      lastName: 'Test',
    };

    console.log(`[${testId}] 🔄 Creating Stripe payment intent...`);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: 100, // €1.00 in cents
      currency: 'eur',
      automatic_payment_methods: { enabled: true },
      metadata: {
        customerEmail: testCustomerData.email,
        testMode: 'true',
        monitoring: 'true',
        testId,
        timestamp: new Date().toISOString(),
      },
    });

    console.log(
      `[${testId}] ✅ Stripe payment intent created successfully (ID: ${paymentIntent.id})`
    );
    return {
      success: true,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error: any) {
    console.error(`[${testId}] ❌ Stripe payment intent test failed:`, {
      message: error.message,
      type: error.type,
      code: error.code,
      statusCode: error.statusCode,
    });
    return {
      success: false,
      error: `${error.type || 'Unknown'}: ${error.message}`,
    };
  }
};

// Test order creation with enhanced error handling
const testOrderCreation = async (
  payload: any
): Promise<{ success: boolean; error?: string; orderNumber?: string }> => {
  const testId = `monitor-order-${Date.now()}`;

  try {
    console.log(`[${testId}] 🧪 Testing order creation...`);

    const testCustomerData = {
      email: 'monitor@shush.dance',
      firstName: 'Monitor',
      lastName: 'Test',
      street: 'Test Street 1',
      city: 'Test City',
      postalCode: '12345',
      country: 'Germany',
    };

    const orderNumber = `MONITOR-TEST-${Date.now()}`;

    console.log(`[${testId}] 🔄 Creating test order: ${orderNumber}`);

    const order = await payload.create({
      collection: 'online-orders',
      data: {
        orderNumber,
        status: 'pending',
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        transactionId: `MONITOR-TEST-TRANSACTION-${Date.now()}`,
        customerEmail: testCustomerData.email,
        customerPhone: '',
        firstName: testCustomerData.firstName,
        lastName: testCustomerData.lastName,
        shippingAddress: {
          street: testCustomerData.street,
          city: testCustomerData.city,
          postalCode: testCustomerData.postalCode,
          country: testCustomerData.country,
          shippingRegion: 'eu',
        },
        items: [
          {
            product: null,
            quantity: 1,
            unitPrice: 1.0,
            lineTotal: 1.0,
            cartItemId: `test-item-${Date.now()}`,
            cartItemName: 'Monitor Test Item',
            cartItemDescription: 'Test item for monitoring',
          },
        ],
        orderTotals: {
          subtotal: 1.0,
          shipping: 0.0,
          vat: 0.0,
          total: 1.0,
        },
        customerNotes: `Automated monitoring test order - ${new Date().toISOString()}`,
      },
    });

    console.log(
      `[${testId}] ✅ Order creation test successful (Order: ${orderNumber})`
    );
    return {
      success: true,
      orderNumber,
    };
  } catch (error: any) {
    console.error(`[${testId}] ❌ Order creation test failed:`, {
      message: error.message,
      stack: error.stack,
    });
    return { success: false, error: error.message };
  }
};

// Send email alert
const sendAlert = async (
  payload: any,
  subject: string,
  errorDetails: string
) => {
  try {
    const alertEmail = process.env.ALERT_EMAIL || 'hello@shush.dance';

    await payload.sendEmail({
      to: alertEmail,
      from: `"SHUSH Monitor" <${process.env.SMTP_USER}>`,
      subject: `🚨 ${subject}`,
      html: `
        <h2>🚨 Payment System Alert</h2>
        <p><strong>Domain:</strong> ${process.env.PAYLOAD_PUBLIC_SERVER_URL}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <hr>
        <h3>Issue Details:</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">${errorDetails}</pre>
        
        <hr>
        <p><em>This is an automated alert from the SHUSH payment system monitor.</em></p>
        
        <p>Check the admin panel: <a href="${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin">Admin Panel</a></p>
      `,
    });

    console.log(`📧 Alert email sent to ${alertEmail}`);
    return true;
  } catch (error: any) {
    console.error(`❌ Failed to send alert email: ${error.message}`);
    return false;
  }
};

export const monitorPaymentSystemEndpoint: Endpoint = {
  path: '/monitor-payment-system',
  method: 'get', // Changed to GET for Uptime Kuma compatibility
  handler: async (req, res) => {
    // Simple API key authentication via query parameter or header
    const apiKey = req.headers['x-api-key'] || req.query.key;
    const expectedApiKey =
      process.env.MONITOR_API_KEY || 'your-secret-monitor-key';

    if (apiKey !== expectedApiKey) {
      console.error('Unauthorized monitoring request');
      return res.status(401).json({
        status: 'error',
        message: 'Unauthorized - Invalid API key',
        timestamp: new Date().toISOString(),
      });
    }

    const monitorId = `monitor-${Date.now()}`;
    console.log(`[${monitorId}] 🔍 Starting payment system monitoring...`);

    const results: MonitoringResult = {
      timestamp: new Date().toISOString(),
      health: getServerHealth(),
      stripe: { success: false },
      order: { success: false },
      overall: true,
    };

    // Log health status
    console.log(`[${monitorId}] 🏥 Server health:`, {
      uptime: results.health.uptime,
      memory: results.health.memory.used,
      hasStripeKey: results.health.hasStripeKey,
      nodeVersion: results.health.nodeVersion,
    });

    try {
      // Test Stripe payment intent
      console.log(`[${monitorId}] 🧪 Running Stripe test...`);
      results.stripe = await testStripePaymentIntent();
      if (!results.stripe.success) {
        results.overall = false;
        console.log(
          `[${monitorId}] ❌ Stripe test failed, skipping order test`
        );
      }

      // Test order creation (only if Stripe works)
      if (results.stripe.success) {
        console.log(`[${monitorId}] 🧪 Running order creation test...`);
        results.order = await testOrderCreation(req.payload);
        if (!results.order.success) {
          results.overall = false;
        }
      } else {
        results.order = { success: false, error: 'Stripe not working' };
        results.overall = false;
      }

      // Handle results
      if (results.overall) {
        console.log(`[${monitorId}] ✅ All payment system tests passed`);

        // For Uptime Kuma: simple success response with health info
        return res.status(200).json({
          status: 'ok',
          message: 'Payment system healthy',
          stripe: results.stripe.success ? 'ok' : 'fail',
          order: results.order.success ? 'ok' : 'fail',
          health: results.health,
          timestamp: results.timestamp,
        });
      } else {
        console.error(`[${monitorId}] ❌ Payment system tests failed`);

        // Compile error details
        const errors = [];
        if (!results.stripe.success)
          errors.push(`Stripe: ${results.stripe.error}`);
        if (!results.order.success)
          errors.push(`Order Creation: ${results.order.error}`);

        const errorMessage = errors.join('\n');

        // Send alert email
        await sendAlert(
          req.payload,
          'Payment System Failure Detected',
          errorMessage
        );

        return res.status(500).json({
          status: 'error',
          message: `Payment system failure: ${errorMessage}`,
          stripe: results.stripe.success ? 'ok' : 'fail',
          order: results.order.success ? 'ok' : 'fail',
          health: results.health,
          timestamp: results.timestamp,
        });
      }
    } catch (error: any) {
      console.error(
        `[${monitorId}] 💥 Payment system monitoring failed: ${error.message}`
      );

      await sendAlert(
        req.payload,
        'Payment System Monitor Error',
        `Monitoring script crashed: ${error.message}`
      );

      return res.status(500).json({
        status: 'error',
        message: `Monitor crashed: ${error.message}`,
        stripe: 'unknown',
        order: 'unknown',
        health: getServerHealth(),
        timestamp: new Date().toISOString(),
      });
    }
  },
};
