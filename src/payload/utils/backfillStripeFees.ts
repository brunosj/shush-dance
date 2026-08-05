import type { Payload } from 'payload';
import Stripe from 'stripe';
import {
  allocateStripeFeeEuros,
  retrieveStripeFeeLookupForTransactionId,
} from './stripeFees';

export type BackfillStripeFeesOptions = {
  dryRun?: boolean;
  /** Overwrite sales that already have a stripeFee. */
  force?: boolean;
  /** Max unique Stripe transactions to look up (0 = no limit). */
  limit?: number;
};

export type BackfillStripeFeesResult = {
  ok: true;
  dryRun: boolean;
  force: boolean;
  stripeKeyMode: string;
  scanned: number;
  candidates: number;
  uniqueTransactions: number;
  updated: number;
  skipped: number;
  missingFee: number;
  /** PaymentIntents that exist in the opposite Stripe mode (test vs live). */
  wrongMode: number;
  errors: number;
  errorMessages: string[];
  samples: Array<{
    id: string;
    transactionId: string;
    stripeFee: number;
    dryRun: boolean;
  }>;
};

function isWrongModeError(message: string): boolean {
  return (
    message.includes('similar object exists in live mode') ||
    message.includes('similar object exists in test mode')
  );
}

function getStripeKeyMode(secretKey: string): string {
  if (secretKey.startsWith('sk_test_')) return 'test';
  if (secretKey.startsWith('sk_live_')) return 'live';
  return 'unknown';
}

function saleNeedsFee(sale: any, force: boolean): boolean {
  if (!sale.transactionId || typeof sale.transactionId !== 'string') {
    return false;
  }
  if (sale.paymentStatus !== 'paid') return false;
  if (force) return true;
  return typeof sale.stripeFee !== 'number' || sale.stripeFee < 0;
}

function saleGrossEuros(sale: any): number {
  if (typeof sale.ticketTotals?.total === 'number') {
    return sale.ticketTotals.total;
  }
  if (typeof sale.total === 'number') return sale.total;
  if (!Array.isArray(sale.tickets)) return 0;
  return sale.tickets.reduce(
    (sum: number, ticket: any) => sum + (ticket.lineTotal || 0),
    0
  );
}

async function loadPaidTicketSales(payload: Payload): Promise<any[]> {
  const docs: any[] = [];
  let page = 1;

  for (;;) {
    const result = await payload.find({
      collection: 'ticket-sales',
      where: {
        and: [
          { paymentStatus: { equals: 'paid' } },
          { transactionId: { exists: true } },
        ],
      },
      limit: 100,
      page,
      depth: 0,
    });

    docs.push(...result.docs);
    if (!result.hasNextPage) break;
    page += 1;
  }

  return docs;
}

export async function backfillStripeFees(
  payload: Payload,
  options: BackfillStripeFeesOptions = {}
): Promise<BackfillStripeFeesResult> {
  const dryRun = Boolean(options.dryRun);
  const force = Boolean(options.force);
  const limit =
    typeof options.limit === 'number' && options.limit > 0
      ? options.limit
      : 0;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY not configured');
  }

  const stripe = new Stripe(secretKey, {
    apiVersion: '2025-08-27.basil',
    maxNetworkRetries: 3,
    timeout: 15000,
  });

  const allSales = await loadPaidTicketSales(payload);
  const candidates = allSales.filter((sale) => saleNeedsFee(sale, force));

  const byTransaction = new Map<string, any[]>();
  for (const sale of candidates) {
    const key = sale.transactionId as string;
    const group = byTransaction.get(key) || [];
    group.push(sale);
    byTransaction.set(key, group);
  }

  let transactionEntries = Array.from(byTransaction.entries());
  if (limit > 0) {
    transactionEntries = transactionEntries.slice(0, limit);
  }

  let updated = 0;
  let skipped = 0;
  let missingFee = 0;
  let wrongMode = 0;
  let errors = 0;
  const errorMessages: string[] = [];
  const samples: BackfillStripeFeesResult['samples'] = [];

  for (const [transactionId, sales] of transactionEntries) {
    try {
      const lookup = await retrieveStripeFeeLookupForTransactionId(
        stripe,
        transactionId,
        { retries: 1, delayMs: 400 }
      );

      if (!lookup) {
        missingFee += sales.length;
        skipped += sales.length;
        continue;
      }

      const feeEuros = lookup.feeCents / 100;
      const paymentTotalEuros = lookup.amountCents / 100;

      for (const sale of sales) {
        const partAmount = saleGrossEuros(sale);
        const allocated = allocateStripeFeeEuros(
          feeEuros,
          partAmount,
          paymentTotalEuros
        );

        if (samples.length < 20) {
          samples.push({
            id: sale.id,
            transactionId,
            stripeFee: allocated,
            dryRun,
          });
        }

        if (!dryRun) {
          await payload.update({
            collection: 'ticket-sales',
            id: sale.id,
            data: { stripeFee: allocated },
          });
        }
        updated += 1;
      }
    } catch (error: any) {
      const message = error?.message || String(error);
      if (isWrongModeError(message)) {
        wrongMode += sales.length;
        skipped += sales.length;
      } else {
        errors += sales.length;
        if (errorMessages.length < 25) {
          errorMessages.push(`${transactionId}: ${message}`);
        }
      }
    }
  }

  return {
    ok: true,
    dryRun,
    force,
    stripeKeyMode: getStripeKeyMode(secretKey),
    scanned: allSales.length,
    candidates: candidates.length,
    uniqueTransactions: transactionEntries.length,
    updated,
    skipped,
    missingFee,
    wrongMode,
    errors,
    errorMessages,
    samples,
  };
}
