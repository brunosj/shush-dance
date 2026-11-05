/**
 * Periodic sync of Stripe Checkout / Payment Link ticket sales into CMS.
 * Complements the realtime `checkout.session.completed` webhook.
 *
 * Env:
 * - STRIPE_TICKET_SYNC_CRON_ENABLED=false to disable
 * - STRIPE_TICKET_SYNC_CRON_MINUTES (default 1440 = once a day)
 * - STRIPE_TICKET_SYNC_CRON_LOOKBACK_DAYS (default 3)
 */

let started = false;

export function setupStripeTicketSalesCron(): void {
  if (started) return;
  if (process.env.NEXT_BUILD) return;
  if (process.env.STRIPE_TICKET_SYNC_CRON_ENABLED === 'false') return;

  const key =
    process.env.STRIPE_TICKET_BACKFILL_KEY || process.env.MONITOR_API_KEY;
  if (!key || !process.env.STRIPE_SECRET_KEY) {
    console.warn(
      '[stripe-ticket-cron] skipped — missing STRIPE_TICKET_BACKFILL_KEY/MONITOR_API_KEY or STRIPE_SECRET_KEY',
    );
    return;
  }

  const minutes = Math.min(
    10080, // max 7 days
    Math.max(
      2,
      parseInt(process.env.STRIPE_TICKET_SYNC_CRON_MINUTES || '1440', 10) ||
        1440,
    ),
  );
  const lookbackDays = Math.min(
    30,
    Math.max(
      1,
      parseInt(process.env.STRIPE_TICKET_SYNC_CRON_LOOKBACK_DAYS || '3', 10) ||
        3,
    ),
  );

  const port = process.env.PORT || '3000';
  const baseUrl = `http://127.0.0.1:${port}`;

  const tick = async () => {
    const until = new Date().toISOString();
    const since = new Date(
      Date.now() - lookbackDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    try {
      const res = await fetch(`${baseUrl}/api/sync-stripe-ticket-sales`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
        },
        body: JSON.stringify({ since, until }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!res.ok || data.ok === false) {
        console.warn(
          '[stripe-ticket-cron] sync failed:',
          data.error || res.statusText,
        );
        return;
      }
      const created = Number(data.created) || 0;
      if (created > 0) {
        console.log(
          `[stripe-ticket-cron] imported ${created} checkout sale(s)`,
        );
      }

      const feeRes = await fetch(`${baseUrl}/api/backfill-stripe-fees`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': key,
        },
        body: JSON.stringify({ dryRun: false, force: false }),
      });
      const feeData = (await feeRes.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!feeRes.ok || feeData.ok === false) {
        console.warn(
          '[stripe-ticket-cron] fee backfill failed:',
          feeData.error || feeRes.statusText,
        );
      } else {
        const feesUpdated = Number(feeData.updated) || 0;
        if (feesUpdated > 0) {
          console.log(
            `[stripe-ticket-cron] stored Stripe fees on ${feesUpdated} sale(s)`,
          );
        }
      }
    } catch (error) {
      console.warn(
        '[stripe-ticket-cron] request error:',
        error instanceof Error ? error.message : error,
      );
    }
  };

  started = true;
  console.log(
    `[stripe-ticket-cron] every ${minutes}m, lookback ${lookbackDays}d → ${baseUrl}`,
  );
  // First run shortly after boot (Payload routes ready).
  setTimeout(() => {
    void tick();
  }, 45_000);
  setInterval(
    () => {
      void tick();
    },
    minutes * 60 * 1000,
  );
}
