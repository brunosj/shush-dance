# SHUSH Payment System Monitoring

This documentation covers the automated monitoring system for the Stripe payment integration using Uptime Kuma.

> **📋 Quick Start**: See [UPTIME_KUMA_SETUP.md](./UPTIME_KUMA_SETUP.md) for step-by-step Uptime Kuma configuration.

## Problem Solved

The Stripe API was experiencing intermittent failures after deployments due to:

- New Stripe instances created on every request
- Lack of retry logic for transient failures
- No proper error handling for different failure types
- Missing monitoring to detect issues quickly

## Solution Overview

### 1. **Improved Stripe API Stability** ✅

**File**: `src/payload/endpoints/createPaymentIntent.ts`

**Improvements:**

- **Cached Stripe Instance**: Single reusable instance instead of creating new ones
- **Retry Logic**: Exponential backoff for transient failures (max 3 retries)
- **Better Error Handling**: Proper status codes and detailed error responses
- **Timeouts**: 10-second timeout to prevent hanging requests
- **Enhanced Logging**: Detailed logging for debugging

**Key Changes:**

```typescript
// Before: New instance every time
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// After: Cached instance with retry logic
let stripeInstance: Stripe | null = null;
const getStripeInstance = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY, {
      maxNetworkRetries: 3,
      timeout: 10000,
    });
  }
  return stripeInstance;
};
```

### 2. **Uptime Kuma Integration** ✅

**Files**:

- `src/payload/endpoints/monitorPaymentSystem.ts` - Monitoring endpoint
- `UPTIME_KUMA_SETUP.md` - Configuration guide

**Features:**

- **Comprehensive Testing**: Tests both Stripe payment intent creation and order processing
- **Uptime Kuma Integration**: Works seamlessly with existing monitoring infrastructure
- **Visual Dashboard**: Real-time status, uptime graphs, and incident timeline
- **Multiple Notifications**: Email, Discord, Slack, SMS, and more
- **API Key Security**: Protected endpoint with configurable API key
- **Flexible Scheduling**: Configurable monitoring frequency (5-30 minutes)

## Setup Instructions

> **🚀 Quick Setup**: Follow the [Uptime Kuma Setup Guide](./UPTIME_KUMA_SETUP.md) for detailed step-by-step instructions.

### 1. Add Environment Variables

Add these to your `.env` file:

```bash
# Payment Monitoring Configuration
MONITOR_API_KEY="your-secret-monitor-key-1234567890"
ALERT_EMAIL="your-email@domain.com"
```

### 2. Deploy the Changes

```bash
# Build and deploy the updated code
pnpm build
# Your existing deployment process
```

### 3. Configure Uptime Kuma

1. **Add New Monitor** in your Uptime Kuma dashboard
2. **Set URL**: `https://shush.dance/api/monitor-payment-system?key=your-api-key`
3. **Configure Notifications**: Email, Discord, Slack, etc.
4. **Set Frequency**: Every 15 minutes (recommended)

See the [detailed Uptime Kuma guide](./UPTIME_KUMA_SETUP.md) for complete configuration.

## Monitoring Endpoint

### API Endpoint

```
GET /api/monitor-payment-system?key=your-secret-monitor-key
```

### Authentication

- **Query Parameter**: `?key=your-secret-monitor-key`
- **Header Alternative**: `X-API-Key: your-secret-monitor-key`

### Responses

**Success (200):**

```json
{
  "status": "ok",
  "message": "Payment system healthy",
  "stripe": "ok",
  "order": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Failure (500):**

```json
{
  "status": "error",
  "message": "Payment system failure: Stripe: Connection timeout",
  "stripe": "fail",
  "order": "fail",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

**Unauthorized (401):**

```json
{
  "status": "error",
  "message": "Unauthorized - Invalid API key",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## What Gets Tested

### 1. Stripe Payment Intent Creation

- Creates a €1.00 test payment intent
- Verifies Stripe API connectivity
- Tests authentication and configuration

### 2. Order Creation

- Creates a test order in the database
- Verifies database connectivity
- Tests order processing workflow

### 3. Email System

- Sends alerts when failures are detected
- Tests SMTP configuration
- Provides detailed error information

## Monitoring Schedule

- **Frequency**: Configurable in Uptime Kuma (recommended: every 15 minutes)
- **Dashboard**: Available in your Uptime Kuma instance
- **Notifications**: Configured per monitor in Uptime Kuma

## Troubleshooting

### Common Issues

**1. 401 Unauthorized**

- Check `MONITOR_API_KEY` in environment variables
- Ensure API key matches in both `.env` and setup script

**2. 500 Stripe Errors**

- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe dashboard for API key validity
- Ensure network connectivity to Stripe

**3. Email Alerts Not Sent**

- Verify SMTP configuration (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS`)
- Check `ALERT_EMAIL` environment variable
- Review email logs in monitoring output

**4. Uptime Kuma Issues**

- Check if Uptime Kuma is running and accessible
- Verify monitor configuration (URL, API key, frequency)
- Check Uptime Kuma logs for connection errors

### Manual Testing

```bash
# Test the monitoring endpoint directly
curl "https://shush.dance/api/monitor-payment-system?key=your-secret-monitor-key"

# Expected response for healthy system:
# {"status":"ok","message":"Payment system healthy","stripe":"ok","order":"ok","timestamp":"..."}

# Test with invalid key (should return 401)
curl "https://shush.dance/api/monitor-payment-system?key=invalid-key"
```

## Security Considerations

- **API Key Protection**: Monitor endpoint requires authentication
- **Test Data**: Uses minimal test amounts (€1.00)
- **Test Isolation**: Test orders are clearly marked as monitoring tests
- **Log Rotation**: Consider setting up log rotation for long-term use

## Maintenance

### Uptime Kuma Management

- **Monitor Status**: Check the SHUSH Payment System monitor in your dashboard
- **Update Frequency**: Edit the monitor settings in Uptime Kuma
- **Notifications**: Configure or update notification channels as needed
- **API Key Rotation**: Update the monitoring URL when rotating keys

### Monitoring Adjustments

**Change Frequency:**

1. Go to your Uptime Kuma dashboard
2. Edit the SHUSH Payment System monitor
3. Adjust "Heartbeat Interval" (5-30 minutes recommended)

**Update Notifications:**

1. Click "Setup Notification" on the monitor
2. Add or modify notification channels
3. Test notifications to ensure they work

### Security Maintenance

- **Rotate API Keys**: Update `MONITOR_API_KEY` in `.env` and Uptime Kuma URL monthly
- **Review Access**: Ensure only authorized team members have Uptime Kuma access
- **Monitor Logs**: Check for unauthorized access attempts

## Success Metrics

With this Uptime Kuma monitoring system, you should expect:

- **Early Detection**: Issues detected within your configured interval (15 minutes recommended)
- **Visual Dashboard**: Real-time status and historical uptime data
- **Reduced Downtime**: Faster response to payment system failures with multiple notification channels
- **Better Reliability**: Improved Stripe API stability with retry logic and caching
- **Centralized Monitoring**: Payment system monitoring integrated with your existing infrastructure

## Next Steps

1. **Configure Uptime Kuma** following the [setup guide](./UPTIME_KUMA_SETUP.md)
2. **Test notifications** to ensure alerts reach the right team members
3. **Monitor the dashboard** for the first few days to verify everything works correctly
4. **Adjust the frequency** based on your needs (5-30 minutes)
5. **Consider additional monitors** for related services (main website, admin panel)

---

**Questions or Issues?** Check the logs first, then review the troubleshooting section above.
