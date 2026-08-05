import type Stripe from 'stripe';

export type StripeFeeLookup = {
  feeCents: number;
  /** Gross amount charged on the PaymentIntent, in cents. */
  amountCents: number;
  paymentIntentId: string;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function feeCentsFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): number | null {
  const latestCharge = paymentIntent.latest_charge;
  if (!latestCharge || typeof latestCharge === 'string') return null;

  const balanceTransaction = latestCharge.balance_transaction;
  if (!balanceTransaction || typeof balanceTransaction === 'string') {
    return null;
  }

  if (typeof balanceTransaction.fee !== 'number') return null;
  return balanceTransaction.fee;
}

function lookupFromPaymentIntent(
  paymentIntent: Stripe.PaymentIntent
): StripeFeeLookup | null {
  const feeCents = feeCentsFromPaymentIntent(paymentIntent);
  if (feeCents === null) return null;

  const amountCents =
    typeof paymentIntent.amount_received === 'number' &&
    paymentIntent.amount_received > 0
      ? paymentIntent.amount_received
      : paymentIntent.amount;

  if (typeof amountCents !== 'number' || amountCents <= 0) return null;

  return {
    feeCents,
    amountCents,
    paymentIntentId: paymentIntent.id,
  };
}

/**
 * Stripe processing fees live on the Charge's BalanceTransaction, not on the
 * PaymentIntent itself. Expand `latest_charge.balance_transaction` to read them.
 *
 * With async capture, the balance transaction can be briefly unavailable right
 * after `payment_intent.succeeded`, so we retry a few times.
 */
export async function retrieveStripeProcessingFeeCents(
  stripe: Stripe,
  paymentIntentId: string,
  options?: { retries?: number; delayMs?: number }
): Promise<number | null> {
  const lookup = await retrieveStripeFeeLookup(
    stripe,
    paymentIntentId,
    options
  );
  return lookup?.feeCents ?? null;
}

export async function retrieveStripeFeeLookup(
  stripe: Stripe,
  paymentIntentId: string,
  options?: { retries?: number; delayMs?: number }
): Promise<StripeFeeLookup | null> {
  const retries = options?.retries ?? 4;
  const delayMs = options?.delayMs ?? 750;

  for (let attempt = 0; attempt <= retries; attempt++) {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
      expand: ['latest_charge.balance_transaction'],
    });

    const lookup = lookupFromPaymentIntent(paymentIntent);
    if (lookup) return lookup;

    if (attempt < retries) {
      await sleep(delayMs);
    }
  }

  return null;
}

/**
 * Resolve fee data from a ticket-sale `transactionId`, which may be a
 * PaymentIntent (`pi_…`) or legacy Checkout Session (`cs_…`).
 */
export async function retrieveStripeFeeLookupForTransactionId(
  stripe: Stripe,
  transactionId: string,
  options?: { retries?: number; delayMs?: number }
): Promise<StripeFeeLookup | null> {
  if (transactionId.startsWith('pi_')) {
    return retrieveStripeFeeLookup(stripe, transactionId, options);
  }

  if (transactionId.startsWith('cs_')) {
    const session = await stripe.checkout.sessions.retrieve(transactionId, {
      expand: ['payment_intent.latest_charge.balance_transaction'],
    });

    const paymentIntent = session.payment_intent;
    if (!paymentIntent || typeof paymentIntent === 'string') {
      if (typeof paymentIntent === 'string') {
        return retrieveStripeFeeLookup(stripe, paymentIntent, options);
      }
      return null;
    }

    const lookup = lookupFromPaymentIntent(paymentIntent);
    if (lookup) return lookup;
    return retrieveStripeFeeLookup(stripe, paymentIntent.id, options);
  }

  return null;
}

/** Allocate a payment-level Stripe fee across parts of the same charge. */
export function allocateStripeFeeEuros(
  totalFeeEuros: number,
  partAmountEuros: number,
  totalAmountEuros: number
): number {
  if (totalFeeEuros <= 0 || totalAmountEuros <= 0 || partAmountEuros <= 0) {
    return 0;
  }
  return Math.round((totalFeeEuros * partAmountEuros * 100) / totalAmountEuros) / 100;
}
