export const SUPPORTED_CURRENCIES = ['EUR', 'GBP'] as const;
export type CheckoutCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const DEFAULT_CURRENCY: CheckoutCurrency = 'EUR';

export function normalizeCurrency(
  value: unknown
): CheckoutCurrency {
  const upper =
    typeof value === 'string' ? value.trim().toUpperCase() : '';
  if (upper === 'GBP') return 'GBP';
  return 'EUR';
}

/** Stripe PaymentIntent currency codes are lowercase. */
export function toStripeCurrency(currency: CheckoutCurrency): 'eur' | 'gbp' {
  return currency === 'GBP' ? 'gbp' : 'eur';
}

export function fromStripeCurrency(value: unknown): CheckoutCurrency {
  const lower = typeof value === 'string' ? value.trim().toLowerCase() : '';
  if (lower === 'gbp') return 'GBP';
  return 'EUR';
}

export function formatMoneyAmount(
  amount: number,
  currency: CheckoutCurrency = DEFAULT_CURRENCY
): string {
  const symbol = currency === 'GBP' ? '£' : '€';
  return `${symbol}${Number(amount).toFixed(2)}`;
}

/**
 * Resolve the single currency of a cart. Missing currency on items = EUR.
 * Returns null if the cart mixes currencies.
 */
export function getCartCurrency(
  cartDetails: Record<string, { currency?: string | null } | undefined> | null | undefined
): CheckoutCurrency | null {
  if (!cartDetails) return DEFAULT_CURRENCY;

  const currencies = new Set<CheckoutCurrency>();
  for (const item of Object.values(cartDetails)) {
    if (!item) continue;
    currencies.add(normalizeCurrency(item.currency));
  }

  if (currencies.size === 0) return DEFAULT_CURRENCY;
  if (currencies.size > 1) return null;
  return currencies.values().next().value as CheckoutCurrency;
}

export function canAddCurrencyToCart(
  cartDetails: Record<string, { currency?: string | null } | undefined> | null | undefined,
  nextCurrency: CheckoutCurrency
): { ok: true } | { ok: false; cartCurrency: CheckoutCurrency } {
  const cartCurrency = getCartCurrency(cartDetails);
  if (cartCurrency === null) {
    return { ok: false, cartCurrency: DEFAULT_CURRENCY };
  }
  if (Object.keys(cartDetails || {}).length === 0) {
    return { ok: true };
  }
  if (cartCurrency !== nextCurrency) {
    return { ok: false, cartCurrency };
  }
  return { ok: true };
}
