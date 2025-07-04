# Uptime Kuma Payment System Monitoring

This guide shows how to configure Uptime Kuma to monitor your SHUSH payment system.

## Prerequisites

- Uptime Kuma instance running and accessible
- SHUSH application deployed with monitoring endpoint
- Environment variables configured

## Step 1: Add Environment Variables

Add these to your SHUSH application's `.env` file:

```bash
# Payment Monitoring Configuration
MONITOR_API_KEY="your-secret-monitor-key-1234567890"
ALERT_EMAIL="your-email@domain.com"
```

**Generate a secure API key:**

```bash
# On your server, generate a random key
openssl rand -hex 32
# Or use this format: monitor-key-$(date +%s)-$(openssl rand -hex 16)
```

## Step 2: Deploy the Changes

Deploy your updated SHUSH application with the new monitoring endpoint:

```bash
pnpm build
# Follow your normal deployment process
```

## Step 3: Configure Uptime Kuma Monitor

### Add New Monitor

1. **Access Uptime Kuma**: Go to your Uptime Kuma dashboard
2. **Add Monitor**: Click the "+" button or "Add New Monitor"
3. **Configure Monitor**:

**Basic Settings:**

- **Monitor Type**: `HTTP(s)`
- **Friendly Name**: `SHUSH Payment System`
- **URL**: `https://shush.dance/api/monitor-payment-system?key=your-secret-monitor-key-1234567890`
- **Method**: `GET`

**Advanced Settings:**

- **Heartbeat Interval**: `15` minutes (recommended)
- **Retries**: `3`
- **Heartbeat Retry Interval**: `1` minute
- **Request Timeout**: `60` seconds

**HTTP Options:**

- **Follow Redirect**: ✅ Enabled
- **Ignore TLS/SSL Error**: ❌ Disabled (ensure HTTPS works properly)

**Expected Status Codes**: `200-299`

**Response Keyword (Optional):**

- **Keyword**: `"status":"ok"`
- **Keyword Type**: `Contains`

This ensures Uptime Kuma not only checks for HTTP 200 but also verifies the payment system is actually working.

### Notification Settings

4. **Set up Notifications**:
   - Click "Setup Notification" in the monitor
   - Configure your preferred notification method (Email, Discord, Slack, etc.)
   - **Recommended**: Email notifications to your operations team

**Example Email Notification:**

- **Notification Type**: `Email (SMTP)`
- **Host**: Your SMTP server
- **To Email**: `your-email@domain.com`
- **Subject**: `🚨 SHUSH Payment System Alert - {{STATUS}}`

## Step 4: Test the Monitor

1. **Save the Monitor**: Click "Save" in Uptime Kuma
2. **Wait for First Check**: The monitor will run within the heartbeat interval
3. **Verify Success**: You should see a green "UP" status

**Manual Test:**

```bash
# Test the endpoint directly
curl "https://shush.dance/api/monitor-payment-system?key=your-secret-monitor-key-1234567890"

# Expected response for healthy system:
{
  "status": "ok",
  "message": "Payment system healthy",
  "stripe": "ok",
  "order": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## Response Examples

### ✅ Healthy System (HTTP 200)

```json
{
  "status": "ok",
  "message": "Payment system healthy",
  "stripe": "ok",
  "order": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### ❌ Payment Issues (HTTP 500)

```json
{
  "status": "error",
  "message": "Payment system failure: Stripe: Connection timeout",
  "stripe": "fail",
  "order": "fail",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 🔒 Authentication Error (HTTP 401)

```json
{
  "status": "error",
  "message": "Unauthorized - Invalid API key",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

## What Gets Monitored

The endpoint tests:

1. **Stripe API Connectivity**
   - Creates a test payment intent (€1.00)
   - Verifies API key validity
   - Tests network connectivity to Stripe

2. **Database Operations**
   - Creates a test order record
   - Verifies database connectivity
   - Tests order processing workflow

3. **Email System** (when failures occur)
   - Sends alert emails
   - Tests SMTP configuration

## Uptime Kuma Dashboard Benefits

With this setup, you get:

- **Visual Status**: Green/Red status indicators
- **Uptime Statistics**: Historical uptime percentages
- **Response Time Graphs**: Monitor API performance
- **Incident Timeline**: See exactly when issues occurred
- **Mobile Friendly**: Check status from anywhere
- **Multiple Notifications**: Email, SMS, Discord, Slack, etc.

## Recommended Settings

### Monitor Frequency

- **Production**: Every 15 minutes (balance between early detection and resource usage)
- **Critical Periods**: Every 5 minutes (during high-traffic events)
- **Maintenance**: Every 30 minutes (during low-traffic periods)

### Notification Thresholds

- **Immediate Alert**: First failure
- **Escalation**: After 3 consecutive failures (45 minutes)
- **Recovery Alert**: When service comes back up

### Additional Monitors (Optional)

Consider adding these related monitors:

1. **Main Website**: `https://shush.dance`
2. **Admin Panel**: `https://shush.dance/admin`
3. **API Health**: `https://shush.dance/api/health` (if available)

## Troubleshooting

### Common Issues

**❌ 401 Unauthorized**

- Check the API key in the URL matches your `.env` file
- Ensure the key is properly URL-encoded
- Verify environment variables are loaded after deployment

**❌ 500 Internal Server Error**

- Check server logs for Stripe connectivity issues
- Verify `STRIPE_SECRET_KEY` environment variable
- Ensure database is accessible

**❌ Timeout/Connection Refused**

- Verify the URL is correct
- Check if the application is running
- Ensure firewall allows connections to your server

**❌ False Positives**

- Increase retry count in Uptime Kuma
- Adjust timeout settings (increase to 60+ seconds)
- Check for temporary network issues

### Debug Steps

1. **Test Manually**:

   ```bash
   curl -v "https://shush.dance/api/monitor-payment-system?key=YOUR_KEY"
   ```

2. **Check Application Logs**:

   ```bash
   # Check PM2 logs (if using PM2)
   pm2 logs

   # Check server logs
   tail -f /var/log/your-app.log
   ```

3. **Verify Environment**:
   ```bash
   # On your server
   echo $MONITOR_API_KEY
   echo $STRIPE_SECRET_KEY
   ```

## Security Considerations

- **API Key Protection**: The key is in the URL, ensure HTTPS is used
- **Uptime Kuma Access**: Secure your Uptime Kuma instance with authentication
- **Log Management**: Monitor API key exposure in logs
- **Key Rotation**: Regularly rotate the monitoring API key

## Advanced Configuration

### Custom Notification Messages

In Uptime Kuma notifications, you can use these variables:

- `{{NAME}}` - Monitor name
- `{{STATUS}}` - UP/DOWN status
- `{{URL}}` - Monitor URL
- `{{MSG}}` - Response message
- `{{TIME}}` - Timestamp

**Example Slack Message:**

```
🚨 SHUSH Payment System Alert
Status: {{STATUS}}
Issue: {{MSG}}
Time: {{TIME}}
Check: {{URL}}
```

### Monitor Groups

Create a monitor group for SHUSH services:

1. Create group: "SHUSH Production"
2. Add all related monitors
3. Set group-level notifications

## Maintenance

### Weekly Tasks

- Review uptime statistics
- Check notification delivery
- Verify monitor response times

### Monthly Tasks

- Rotate API keys
- Review and adjust monitoring frequency
- Update notification contacts

### Quarterly Tasks

- Test disaster recovery scenarios
- Review and update escalation procedures
- Audit notification settings

---

**Need Help?** Check the [main monitoring documentation](./PAYMENT_MONITORING.md) or Uptime Kuma's official documentation.
