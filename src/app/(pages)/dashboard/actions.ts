'use server';

import { cookies } from 'next/headers';

export type SyncStripeTicketSalesResult =
  | {
      ok: true;
      created: number;
      skipped: number;
      errors: number;
      errorMessages: string[];
      skippedSamples: string[];
      checkoutSessionsListed: number;
      stripeKeyMode: string;
      windowSinceIso: string;
      windowUntilIso: string;
      feesUpdated: number;
      feesMissing: number;
      feesWrongMode: number;
      feesErrors: number;
      feeErrorMessages: string[];
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

async function requireAdminApiAccess(): Promise<
  | { ok: true; payloadUrl: string; key: string }
  | { ok: false; error: string }
> {
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

  return { ok: true, payloadUrl, key };
}

/** Syncs Checkout Sessions into ticket-sales, then backfills real Stripe fees. */
export async function syncStripeTicketSalesAction(
  since?: string,
  until?: string
): Promise<SyncStripeTicketSalesResult> {
  const access = await requireAdminApiAccess();
  if (access.ok === false) {
    return { ok: false, error: access.error };
  }

  const { payloadUrl, key } = access;

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

  let feesUpdated = 0;
  let feesMissing = 0;
  let feesWrongMode = 0;
  let feesErrors = 0;
  let feeErrorMessages: string[] = [];

  try {
    const feeRes = await fetch(`${payloadUrl}/api/backfill-stripe-fees`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
      },
      body: JSON.stringify({ dryRun: false, force: false }),
      cache: 'no-store',
    });

    let feeData: Record<string, unknown> = {};
    try {
      feeData = await feeRes.json();
    } catch {
      feeData = {};
    }

    if (!feeRes.ok || feeData.ok === false) {
      feesErrors = 1;
      feeErrorMessages = [
        (feeData.error as string) ||
          feeRes.statusText ||
          'Stripe fee backfill failed',
      ];
    } else {
      feesUpdated = Number(feeData.updated) || 0;
      feesMissing = Number(feeData.missingFee) || 0;
      feesWrongMode = Number(feeData.wrongMode) || 0;
      feesErrors = Number(feeData.errors) || 0;
      feeErrorMessages = Array.isArray(feeData.errorMessages)
        ? (feeData.errorMessages as string[])
        : [];
    }
  } catch (error: any) {
    feesErrors = 1;
    feeErrorMessages = [error?.message || 'Stripe fee backfill failed'];
  }

  const skippedSessionIds = Array.isArray(data.skippedSessionIds)
    ? (data.skippedSessionIds as string[])
    : [];

  return {
    ok: true,
    created: Number(data.created) || 0,
    skipped: Number(data.skipped) || 0,
    errors: Number(data.errors) || 0,
    errorMessages: Array.isArray(data.errorMessages)
      ? (data.errorMessages as string[])
      : [],
    skippedSamples: skippedSessionIds.slice(0, 5),
    checkoutSessionsListed: Number(data.checkoutSessionsListed) || 0,
    stripeKeyMode: String(data.stripeKeyMode || 'unknown'),
    windowSinceIso: w?.sinceIso || win.since,
    windowUntilIso: w?.untilIso || win.until,
    feesUpdated,
    feesMissing,
    feesWrongMode,
    feesErrors,
    feeErrorMessages,
  };
}

export type BackfillStripeFeesActionResult =
  | {
      ok: true;
      dryRun: boolean;
      stripeKeyMode: string;
      scanned: number;
      candidates: number;
      uniqueTransactions: number;
      updated: number;
      skipped: number;
      missingFee: number;
      wrongMode: number;
      errors: number;
      errorMessages: string[];
    }
  | { ok: false; error: string };

/** Backfill real Stripe fees onto ticket-sales missing stripeFee. */
export async function backfillStripeFeesAction(
  options: { dryRun?: boolean; force?: boolean } = {}
): Promise<BackfillStripeFeesActionResult> {
  const access = await requireAdminApiAccess();
  if (access.ok === false) {
    return { ok: false, error: access.error };
  }

  const { payloadUrl, key } = access;

  const syncRes = await fetch(`${payloadUrl}/api/backfill-stripe-fees`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
    },
    body: JSON.stringify({
      dryRun: Boolean(options.dryRun),
      force: Boolean(options.force),
    }),
    cache: 'no-store',
  });

  let data: Record<string, unknown> = {};
  try {
    data = await syncRes.json();
  } catch {
    return { ok: false, error: 'Invalid response from backfill endpoint' };
  }

  if (!syncRes.ok || data.ok === false) {
    return {
      ok: false,
      error: (data.error as string) || syncRes.statusText || 'Backfill failed',
    };
  }

  return {
    ok: true,
    dryRun: Boolean(data.dryRun),
    stripeKeyMode: String(data.stripeKeyMode || 'unknown'),
    scanned: Number(data.scanned) || 0,
    candidates: Number(data.candidates) || 0,
    uniqueTransactions: Number(data.uniqueTransactions) || 0,
    updated: Number(data.updated) || 0,
    skipped: Number(data.skipped) || 0,
    missingFee: Number(data.missingFee) || 0,
    wrongMode: Number(data.wrongMode) || 0,
    errors: Number(data.errors) || 0,
    errorMessages: Array.isArray(data.errorMessages)
      ? (data.errorMessages as string[])
      : [],
  };
}
