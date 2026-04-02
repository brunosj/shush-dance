'use server';

import { cookies } from 'next/headers';

export type SyncStripeTicketSalesResult =
  | {
      ok: true;
      created: number;
      skipped: number;
      errors: number;
      errorMessages: string[];
      checkoutSessionsListed: number;
      stripeKeyMode: string;
      windowSinceIso: string;
      windowUntilIso: string;
    }
  | { ok: false; error: string };

function getPayloadBaseUrl(): string | null {
  return (
    process.env.PAYLOAD_PUBLIC_SERVER_URL ||
    process.env.NEXT_PUBLIC_PAYLOAD_URL ||
    null
  );
}

function defaultSyncWindow(): { since: string; until: string } {
  const days = Math.min(
    730,
    Math.max(
      1,
      parseInt(process.env.STRIPE_TICKET_SYNC_LOOKBACK_DAYS || '365', 10) || 365
    )
  );
  const until = new Date().toISOString();
  const since = new Date(
    Date.now() - days * 24 * 60 * 60 * 1000
  ).toISOString();
  return { since, until };
}

/** Syncs Checkout Sessions into ticket-sales. Uses STRIPE_TICKET_SYNC_LOOKBACK_DAYS (default 365). */
export async function syncStripeTicketSalesAction(
  since?: string,
  until?: string
): Promise<SyncStripeTicketSalesResult> {
  const payloadUrl = getPayloadBaseUrl();
  if (!payloadUrl) {
    return { ok: false, error: 'PAYLOAD URL not configured' };
  }

  const cookieStore = cookies();
  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  const meRes = await fetch(`${payloadUrl}/api/users/me`, {
    headers: { Cookie: cookieHeader },
    cache: 'no-store',
  });

  if (!meRes.ok) {
    return { ok: false, error: 'Not authenticated' };
  }

  const me = await meRes.json();
  const roles: string[] = me.user?.roles || [];
  if (!roles.includes('admin')) {
    return { ok: false, error: 'Admin only' };
  }

  const key =
    process.env.STRIPE_TICKET_BACKFILL_KEY || process.env.MONITOR_API_KEY;
  if (!key) {
    return {
      ok: false,
      error:
        'STRIPE_TICKET_BACKFILL_KEY or MONITOR_API_KEY must be set on the server',
    };
  }

  const win =
    since && until
      ? { since, until }
      : since
        ? { since, until: new Date().toISOString() }
        : defaultSyncWindow();

  const syncRes = await fetch(`${payloadUrl}/api/sync-stripe-ticket-sales`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify({ since: win.since, until: win.until }),
    cache: 'no-store',
  });

  let data: Record<string, unknown> = {};
  try {
    data = await syncRes.json();
  } catch {
    return { ok: false, error: 'Invalid response from sync endpoint' };
  }

  if (!syncRes.ok || data.ok === false) {
    return {
      ok: false,
      error: (data.error as string) || syncRes.statusText || 'Sync failed',
    };
  }

  const w = data.window as Record<string, string> | undefined;

  return {
    ok: true,
    created: Number(data.created) || 0,
    skipped: Number(data.skipped) || 0,
    errors: Number(data.errors) || 0,
    errorMessages: Array.isArray(data.errorMessages)
      ? (data.errorMessages as string[])
      : [],
    checkoutSessionsListed: Number(data.checkoutSessionsListed) || 0,
    stripeKeyMode: String(data.stripeKeyMode || 'unknown'),
    windowSinceIso: w?.sinceIso || win.since,
    windowUntilIso: w?.untilIso || win.until,
  };
}
