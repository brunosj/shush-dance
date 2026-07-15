# Uptime Kuma monitoring for shush.dance

The site exposes two endpoints for external monitoring. Use Uptime Kuma instead of the in-browser `PaymentMonitor` (removed) — it is cheaper, does not hit SSR pages, and will not amplify outages.

## Prerequisites

On the server, confirm these env vars are set (see `.env.production`):

- `MONITOR_API_KEY` — shared secret for the payment monitor endpoint
- `ALERT_EMAIL` — receives emails when the payment monitor fails
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, SMTP vars — checked by the monitor

---

## Monitor 1: Basic uptime (required)

Checks that the Node process and Payload API are responding.

| Field | Value |
|---|---|
| **Monitor type** | HTTP(s) |
| **Friendly name** | SHUSH — Health |
| **URL** | `https://shush.dance/api/health` |
| **Method** | GET |
| **Expected status** | 200 |
| **Interval** | 60 seconds |
| **Retries** | 2 |
| **Timeout** | 30 seconds |

**Success response example:**

```json
{
  "status": "ok",
  "service": "shush-dance",
  "timestamp": "..."
}
```

Use this as your primary “is the site up?” check. It does not create Stripe traffic.

---

## Monitor 2: Payment system (recommended)

Checks Stripe connectivity, database access, and critical config (webhook secret + SMTP). Does **not** create payment intents when `skipPaymentIntents=true`.

| Field | Value |
|---|---|
| **Monitor type** | HTTP(s) — Keyword |
| **Friendly name** | SHUSH — Payments |
| **URL** | `https://shush.dance/api/monitor-payment-system?key=YOUR_MONITOR_API_KEY&skipPaymentIntents=true` |
| **Method** | GET |
| **Expected status** | 200 |
| **Keyword (must contain)** | `"status":"ok"` |
| **Interval** | 5 minutes |
| **Retries** | 2 |
| **Timeout** | 60 seconds |

Replace `YOUR_MONITOR_API_KEY` with the value of `MONITOR_API_KEY` from production env.

**Alternative auth:** send header `X-API-Key: YOUR_MONITOR_API_KEY` instead of the query param (slightly cleaner in logs).

**On failure:** endpoint returns HTTP 500 and sends an alert email to `ALERT_EMAIL`.

**Success response fields to watch:**

```json
{
  "status": "ok",
  "stripe": "ok",
  "endpoint": "skipped",
  "database": "ok",
  "config": "ok",
  "mode": "no-transactions"
}
```

---

## Monitor 3: Full checkout path (optional, weekly)

Creates a minimal €0.01 Stripe payment intent through the real public endpoint. Use sparingly — it touches live Stripe and creates test intents.

| Field | Value |
|---|---|
| **Monitor type** | HTTP(s) — Keyword |
| **Friendly name** | SHUSH — Payment intent (full) |
| **URL** | `https://shush.dance/api/monitor-payment-system?key=YOUR_MONITOR_API_KEY` |
| **Method** | GET |
| **Expected status** | 200 |
| **Keyword** | `"endpoint":"ok"` |
| **Interval** | 7 days (or manual) |
| **Timeout** | 90 seconds |

Only enable this if you want end-to-end verification of `/api/create-payment-intent`. For day-to-day ops, Monitor 2 is enough.

---

## Monitor 4: Homepage availability (optional)

Lightweight check that the public site responds. Uses HEAD to avoid downloading the full HTML payload.

| Field | Value |
|---|---|
| **Monitor type** | HTTP(s) |
| **Friendly name** | SHUSH — Homepage |
| **URL** | `https://shush.dance/` |
| **Method** | HEAD |
| **Expected status** | 200 |
| **Interval** | 5 minutes |
| **Timeout** | 30 seconds |

If the CMS is down but `/api/health` is up, this monitor will fail while Monitor 1 still passes — useful for catching SSR/data issues.

---

## Suggested notification setup in Uptime Kuma

1. Create a **Notification** (email, Telegram, Slack, etc.) for the SHUSH group.
2. Attach **Monitor 1** and **Monitor 2** to that notification.
3. Set Monitor 2 to a longer interval (5 min) to avoid alert noise.
4. Optionally create a separate “critical” notification for Monitor 3 (weekly full test).

---

## What not to monitor

- Do **not** point monitors at `/` with GET on a 30s interval from many clients — homepage SSR fans out to multiple internal API calls.
- Do **not** re-enable the browser `PaymentMonitor` component — it duplicated this work and made outages worse.
- Do **not** put `MONITOR_API_KEY` in client-side code; Uptime Kuma stores it server-side.

---

## Quick verification (from your machine)

```bash
# Basic health
curl -s https://shush.dance/api/health | jq .

# Payment monitor (no Stripe transactions)
curl -s "https://shush.dance/api/monitor-payment-system?key=$MONITOR_API_KEY&skipPaymentIntents=true" | jq .
```

Both should return `"status": "ok"`.
