# Stripe Webhook Setup Guide

## Development Testing with Stripe CLI

### 1. Install Stripe CLI

```bash
# macOS
brew install stripe/stripe-cli/stripe

# Or download from: https://stripe.com/docs/stripe-cli
```

### 2. Login to Stripe

```bash
stripe login
```

### 3. Forward Webhooks to Local Server

```bash
stripe listen --forward-to localhost:3000/api/stripe-webhook
```

This command will:

- Display a webhook signing secret (starts with `whsec_`)
- Forward all Stripe events to your local server
- Show real-time webhook events in terminal

### 4. Set Environment Variable

Add to your `.env.local`:

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_cli_secret_here
```

### 5. Test Payment Flow

1. Start your development server: `npm run dev`
2. Keep Stripe CLI running in another terminal
3. Make a test payment
4. Watch webhook events in CLI terminal and application logs

---

## Production Setup

### 1. Create Webhook Endpoint in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com) → **Developers** → **Webhooks**
2. Click **"Add endpoint"**
3. **Endpoint URL**: `https://shush.dance/api/stripe-webhook`
4. **Events to send**: Select `payment_intent.succeeded`
5. **Save** the endpoint

### 2. Get Production Webhook Secret

1. Click on your webhook endpoint
2. Click **"Reveal"** next to "Signing secret"
3. Copy the secret (starts with `whsec_`)

### 3. Set Production Environment Variable

```bash
STRIPE_WEBHOOK_SECRET=whsec_your_production_secret_here
```

### 4. Test Production Webhook

Use Stripe Dashboard's webhook testing tool to send test events to your live endpoint.

---

## How It Works

### Payment Flow

```
1. Customer pays → Stripe processes payment
2. Stripe sends webhook → Your server receives payment_intent.succeeded
3. Webhook creates order → CMS entries + emails sent
4. Fallback system → Ensures order creation if webhook fails
```

### Webhook vs Fallback

- **Primary**: Webhook handles 99.9% of orders (reliable, all payment methods)
- **Fallback**: Client-side backup catches webhook failures after 4 seconds
- **Deduplication**: Prevents double order creation

### Environment Differences

- **Development**: Uses CLI secret, bypasses signature verification
- **Production**: Uses Dashboard secret, full signature verification

---

## Troubleshooting

### Common Issues

- **"Missing webhook secret"**: Check environment variable is set
- **"Signature verification failed"**: Wrong secret or malformed request
- **"Webhook not triggered"**: Check endpoint URL and selected events

### Debug Commands

```bash
# Test webhook endpoint directly
curl -X POST http://localhost:3000/api/stripe-webhook

# Check Stripe CLI logs
stripe logs tail

# Monitor webhook delivery in Dashboard
# Stripe Dashboard → Developers → Webhooks → [Your endpoint] → Attempts
```
