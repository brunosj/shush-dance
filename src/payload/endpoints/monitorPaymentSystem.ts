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
  endpoint: {
    success: boolean;
    error?: string;
    paymentIntentId?: string;
    responseTime?: number;
    attempts?: number;
    errorPattern?: string;
  };
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
      timeout: 8000, // 8 second timeout (matching production)
      telemetry: false, // Disable telemetry to reduce overhead
      appInfo: {
        name: 'SHUSH-Monitor',
        version: '1.0.0',
      },
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

// Test actual production endpoint with multiple requests to catch stale instance issues
const testPaymentIntentEndpoint = async (): Promise<{
  success: boolean;
  error?: string;
  paymentIntentId?: string;
  responseTime?: number;
  attempts?: number;
  errorPattern?: string;
}> => {
  const testId = `endpoint-${Date.now()}`;

  // Test with multiple requests to catch stale instance issues
  const testAttempts = 3;
  const results: Array<{
    success: boolean;
    responseTime: number;
    status: number;
    error?: string;
  }> = [];

  console.log(
    `[${testId}] 🧪 Testing production endpoint with ${testAttempts} requests...`
  );

  for (let i = 1; i <= testAttempts; i++) {
    const startTime = Date.now();
    let timeoutId: NodeJS.Timeout | null = null;

    try {
      const testPayload = {
        amount: 1.0, // €1.00 test payment
        currency: 'eur',
        customerData: {
          email: 'monitor@shush.dance',
          firstName: 'Monitor',
          lastName: `EndpointTest${i}`,
        },
      };

      // Make HTTP request through the SAME path browsers use
      // Use the public domain, not internal server URL
      const publicUrl =
        process.env.PAYLOAD_PUBLIC_SERVER_URL || 'https://shush.dance';
      const testUrl = `${publicUrl}/api/create-payment-intent`;

      console.log(
        `[${testId}] 🌐 Testing via public URL: ${testUrl} (attempt ${i})`
      );

      // Add network debugging info
      console.log(`[${testId}] 🔍 Network debug info:`, {
        serverHostname: require('os').hostname(),
        serverIP: require('os').networkInterfaces(),
        publicUrl,
        isLocalhost:
          publicUrl.includes('localhost') || publicUrl.includes('127.0.0.1'),
        isInternalNetwork:
          publicUrl.includes('192.168.') || publicUrl.includes('10.'),
        processEnv: {
          NODE_ENV: process.env.NODE_ENV,
          PAYLOAD_PUBLIC_SERVER_URL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
        },
      });

      // Force external DNS resolution and disable keep-alive to simulate fresh browser requests
      const controller = new AbortController();
      timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

      const response = await fetch(testUrl, {
        signal: controller.signal,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', // Real browser UA
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          Origin: publicUrl, // Important for CORS
          Referer: `${publicUrl}/cart`, // Simulate coming from cart page
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'X-Test-Attempt': i.toString(),
          'X-Monitor-Test': 'true', // Identify as monitor
        },
        body: JSON.stringify(testPayload),
      });

      const responseTime = Date.now() - startTime;
      if (timeoutId) clearTimeout(timeoutId); // Clear timeout since request completed

      let responseData: any = {};

      try {
        responseData = await response.json();
      } catch (jsonError) {
        // Handle cases where response is not JSON (like 502 errors)
        try {
          const rawText = await response.text();
          responseData = {
            error: 'Invalid JSON response',
            rawResponse: rawText.substring(0, 200), // Limit raw response length
          };
        } catch (textError) {
          responseData = {
            error: 'Could not read response',
            details: textError.message,
          };
        }
      }

      console.log(`[${testId}] 📊 Attempt ${i} response:`, {
        status: response.status,
        responseTime: `${responseTime}ms`,
        hasClientSecret: !!responseData.clientSecret,
        hasPaymentIntentId: !!responseData.paymentIntentId,
      });

      results.push({
        success: response.ok && !!responseData.clientSecret,
        responseTime,
        status: response.status,
        error: !response.ok
          ? `HTTP ${response.status}: ${responseData.error || 'Unknown error'}`
          : undefined,
      });

      // Small delay between requests
      if (i < testAttempts) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      if (timeoutId) clearTimeout(timeoutId); // Clear timeout in case of error

      // Determine error type
      let errorType = error.constructor.name;
      if (error.name === 'AbortError') {
        errorType = 'TIMEOUT';
      } else if (error.message?.includes('ECONNREFUSED')) {
        errorType = 'CONNECTION_REFUSED';
      } else if (error.message?.includes('ENOTFOUND')) {
        errorType = 'DNS_ERROR';
      }

      console.error(`[${testId}] ❌ Attempt ${i} error:`, {
        message: error.message,
        type: errorType,
        originalType: error.constructor.name,
        responseTime: `${responseTime}ms`,
      });

      results.push({
        success: false,
        responseTime,
        status: 0,
        error: `${errorType}: ${error.message}`,
      });
    }
  }

  // Analyze results
  const successCount = results.filter((r) => r.success).length;
  const failureCount = results.filter((r) => !r.success).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );
  const has502Errors = results.some((r) => r.status === 502);
  const hasTimeouts = results.some((r) => r.error?.includes('timeout'));
  const hasConnectionErrors = results.some(
    (r) => r.error?.includes('connection') || r.error?.includes('ECONNRESET')
  );

  // Determine error pattern
  let errorPattern = '';
  if (has502Errors) errorPattern = '502_BAD_GATEWAY';
  else if (hasTimeouts) errorPattern = 'TIMEOUT';
  else if (hasConnectionErrors) errorPattern = 'CONNECTION_ERROR';
  else if (failureCount > 0) errorPattern = 'GENERAL_FAILURE';

  console.log(`[${testId}] 📊 Endpoint test summary:`, {
    successCount,
    failureCount,
    avgResponseTime: `${avgResponseTime}ms`,
    errorPattern,
    has502Errors,
    hasTimeouts,
    hasConnectionErrors,
  });

  // Consider test successful if at least 2 out of 3 attempts succeed
  const overallSuccess = successCount >= 2;

  if (overallSuccess) {
    console.log(
      `[${testId}] ✅ Production endpoint test passed (${successCount}/${testAttempts} attempts)`
    );
    return {
      success: true,
      paymentIntentId: results.find((r) => r.success)?.toString(),
      responseTime: avgResponseTime,
      attempts: testAttempts,
    };
  } else {
    const mainError = results.find((r) => !r.success)?.error || 'Unknown error';
    console.log(
      `[${testId}] ❌ Production endpoint test failed (${failureCount}/${testAttempts} attempts failed)`
    );

    // Special handling for 502 errors (the main issue)
    if (has502Errors) {
      console.log(
        `[${testId}] 🚨 CRITICAL: 502 Bad Gateway detected - this is the client issue!`
      );
    }

    return {
      success: false,
      error: `${failureCount}/${testAttempts} attempts failed. Pattern: ${errorPattern}. Main error: ${mainError}`,
      responseTime: avgResponseTime,
      attempts: testAttempts,
      errorPattern,
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

// Send email alert with enhanced 502 error detection
const sendAlert = async (
  payload: any,
  subject: string,
  errorDetails: string,
  errorPattern?: string
) => {
  try {
    const alertEmail = process.env.ALERT_EMAIL || 'hello@shush.dance';

    // Enhanced subject for 502 errors
    let enhancedSubject = subject;
    if (errorPattern === '502_BAD_GATEWAY') {
      enhancedSubject = `🔥 CRITICAL: 502 Bad Gateway - Client Payment Failures`;
    } else if (errorPattern === 'TIMEOUT') {
      enhancedSubject = `⏱️ WARNING: Payment System Timeouts`;
    } else if (errorPattern === 'CONNECTION_ERROR') {
      enhancedSubject = `🔌 ERROR: Connection Issues`;
    }

    const isUrgent =
      errorPattern === '502_BAD_GATEWAY' || errorPattern === 'TIMEOUT';
    const urgencyText = isUrgent
      ? '<div style="background: #ff4444; color: white; padding: 10px; border-radius: 5px; margin: 10px 0;"><strong>⚠️ URGENT: This affects real customer payments!</strong></div>'
      : '';

    await payload.sendEmail({
      to: alertEmail,
      from: `"SHUSH Monitor" <${process.env.SMTP_USER}>`,
      subject: `🚨 ${enhancedSubject}`,
      html: `
        <h2>🚨 Payment System Alert</h2>
        <p><strong>Domain:</strong> ${process.env.PAYLOAD_PUBLIC_SERVER_URL}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <p><strong>Error Pattern:</strong> ${errorPattern || 'UNKNOWN'}</p>
        
        ${urgencyText}
        
        <hr>
        <h3>Issue Details:</h3>
        <pre style="background: #f5f5f5; padding: 10px; border-radius: 5px; font-family: monospace;">${errorDetails}</pre>
        
        ${
          errorPattern === '502_BAD_GATEWAY'
            ? `
        <hr>
        <h3>🔥 502 Bad Gateway - What This Means:</h3>
        <ul style="color: #d32f2f;">
          <li><strong>Customer Impact:</strong> Users cannot complete payments</li>
          <li><strong>Likely Cause:</strong> Stale Stripe instance or server overload</li>
          <li><strong>Action Required:</strong> Restart the application or check server resources</li>
        </ul>
        `
            : ''
        }
        
        <hr>
        <p><em>This is an automated alert from the SHUSH payment system monitor.</em></p>
        
        <p>Check the admin panel: <a href="${process.env.PAYLOAD_PUBLIC_SERVER_URL}/admin">Admin Panel</a></p>
        <p>View server logs: <code>pm2 logs</code> or <code>docker logs container-name</code></p>
      `,
    });

    console.log(
      `📧 ${isUrgent ? 'URGENT' : 'Normal'} alert email sent to ${alertEmail}`
    );
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
      endpoint: { success: false },
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
      // Test 1: Direct Stripe API
      console.log(`[${monitorId}] 🧪 Running direct Stripe API test...`);
      results.stripe = await testStripePaymentIntent();
      if (!results.stripe.success) {
        results.overall = false;
        console.log(`[${monitorId}] ❌ Direct Stripe test failed`);
      }

      // Test 2: Actual production endpoint
      console.log(`[${monitorId}] 🧪 Running production endpoint test...`);
      results.endpoint = await testPaymentIntentEndpoint();
      if (!results.endpoint.success) {
        results.overall = false;
        console.log(`[${monitorId}] ❌ Production endpoint test failed`);
      }

      // Test 3: Order creation (only if at least one payment test works)
      if (results.stripe.success || results.endpoint.success) {
        console.log(`[${monitorId}] 🧪 Running order creation test...`);
        results.order = await testOrderCreation(req.payload);
        if (!results.order.success) {
          results.overall = false;
        }
      } else {
        results.order = { success: false, error: 'No payment system working' };
        results.overall = false;
      }

      // Handle results
      if (results.overall) {
        console.log(`[${monitorId}] ✅ All payment system tests passed`, {
          stripeAPI: results.stripe.success ? '✅' : '❌',
          endpoint: results.endpoint.success ? '✅' : '❌',
          endpointTime: results.endpoint.responseTime
            ? `${results.endpoint.responseTime}ms`
            : 'N/A',
          order: results.order.success ? '✅' : '❌',
        });

        // For Uptime Kuma: simple success response with health info
        return res.status(200).json({
          status: 'ok',
          message: 'Payment system healthy',
          stripe: results.stripe.success ? 'ok' : 'fail',
          endpoint: results.endpoint.success ? 'ok' : 'fail',
          order: results.order.success ? 'ok' : 'fail',
          health: results.health,
          responseTime: results.endpoint.responseTime,
          attempts: results.endpoint.attempts,
          errorPattern: results.endpoint.errorPattern || 'none',
          timestamp: results.timestamp,
        });
      } else {
        console.error(`[${monitorId}] ❌ Payment system tests failed`, {
          stripeAPI: results.stripe.success ? '✅' : '❌',
          endpoint: results.endpoint.success ? '✅' : '❌',
          endpointTime: results.endpoint.responseTime
            ? `${results.endpoint.responseTime}ms`
            : 'N/A',
          order: results.order.success ? '✅' : '❌',
        });

        // Compile error details
        const errors = [];
        if (!results.stripe.success)
          errors.push(`Stripe API: ${results.stripe.error}`);
        if (!results.endpoint.success)
          errors.push(`Endpoint: ${results.endpoint.error}`);
        if (!results.order.success)
          errors.push(`Order Creation: ${results.order.error}`);

        const errorMessage = errors.join('\n');
        const errorPattern = results.endpoint.errorPattern;

        // Enhanced error details for alerting
        const enhancedErrorDetails = `
Monitor Results:
- Stripe API: ${results.stripe.success ? '✅ OK' : '❌ FAILED'}
- Production Endpoint: ${results.endpoint.success ? '✅ OK' : '❌ FAILED'}
- Database/Orders: ${results.order.success ? '✅ OK' : '❌ FAILED'}

${
  results.endpoint.attempts
    ? `Endpoint Test Details:
- Attempts: ${results.endpoint.attempts}
- Avg Response Time: ${results.endpoint.responseTime}ms
- Error Pattern: ${errorPattern || 'NONE'}`
    : ''
}

Error Messages:
${errorMessage}

${
  errorPattern === '502_BAD_GATEWAY'
    ? `
🚨 CRITICAL: 502 Bad Gateway Detected!
This is the exact error customers are experiencing.
The Stripe instance may be stale or the server is overloaded.

Recommended Actions:
1. Restart the application: pm2 restart all
2. Check memory usage: free -h
3. Check server logs for memory leaks
4. Verify Stripe instance TTL is working
`
    : ''
}
        `.trim();

        // Send alert email with error pattern
        await sendAlert(
          req.payload,
          'Payment System Failure Detected',
          enhancedErrorDetails,
          errorPattern
        );

        return res.status(500).json({
          status: 'error',
          message: `Payment system failure: ${errorMessage}`,
          stripe: results.stripe.success ? 'ok' : 'fail',
          endpoint: results.endpoint.success ? 'ok' : 'fail',
          order: results.order.success ? 'ok' : 'fail',
          health: results.health,
          responseTime: results.endpoint.responseTime,
          attempts: results.endpoint.attempts,
          errorPattern: results.endpoint.errorPattern || 'unknown',
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
        endpoint: 'unknown',
        order: 'unknown',
        health: getServerHealth(),
        timestamp: new Date().toISOString(),
      });
    }
  },
};
