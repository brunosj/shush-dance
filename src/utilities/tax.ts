import {
  calculateVAT,
  SHIPPING_LOCATIONS,
  type ShippingRegion,
} from '../app/_types/shipping';

export const DEFAULT_TICKET_VAT_RATE = 7;
export const CART_SCHEMA_VERSION = 2;

export type CartItemTaxInput = {
  type: 'ticket' | 'merch' | 'release' | string;
  grossCents: number;
  quantity: number;
  vatRate?: number;
};

export type OrderTotalsBreakdown = {
  subtotal: number;
  shipping: number;
  vat: number;
  merchVat: number;
  shippingVat: number;
  ticketVat: number;
  ticketNet: number;
  ticketGross: number;
  merchNet: number;
  total: number;
};

/** Derive net/VAT from a VAT-inclusive gross amount in integer cents. */
export function splitGrossIntoNetAndVatCents(
  grossCents: number,
  vatRatePercent: number
): { netCents: number; vatCents: number } {
  if (grossCents <= 0) return { netCents: 0, vatCents: 0 };
  const rate = Math.max(0, vatRatePercent) / 100;
  const netCents = Math.round(grossCents / (1 + rate));
  const vatCents = grossCents - netCents;
  return { netCents, vatCents };
}

export function getMerchVatRate(region: ShippingRegion): number {
  const location = SHIPPING_LOCATIONS.find((loc) => loc.region === region);
  return location?.vatRate ?? 0;
}

export function buildTicketCartId(eventId: string, tierId: string): string {
  return `ticket-${eventId}-${tierId}`;
}

export function parseTicketCartId(
  cartId: string
): { eventId: string; tierId: string } | null {
  if (!cartId.startsWith('ticket-')) return null;
  const rest = cartId.slice('ticket-'.length);
  const lastDash = rest.lastIndexOf('-');
  if (lastDash <= 0) return null;
  return {
    eventId: rest.slice(0, lastDash),
    tierId: rest.slice(lastDash + 1),
  };
}

export function isLegacyStripeTicketCartId(cartId: string): boolean {
  return cartId.includes('price_');
}

export function calculateOrderTotalsFromCartItems(
  items: CartItemTaxInput[],
  shippingCostEuros: number,
  region: ShippingRegion
): OrderTotalsBreakdown {
  const merchVatRate = getMerchVatRate(region);
  const shippingCost = Math.round(shippingCostEuros * 100);

  let merchNetCents = 0;
  let ticketNetCents = 0;
  let ticketVatCents = 0;
  let ticketGrossCents = 0;

  for (const item of items) {
    const lineGross = item.grossCents * item.quantity;
    if (item.type === 'ticket') {
      const rate = item.vatRate ?? DEFAULT_TICKET_VAT_RATE;
      const { netCents, vatCents } = splitGrossIntoNetAndVatCents(lineGross, rate);
      ticketNetCents += netCents;
      ticketVatCents += vatCents;
      ticketGrossCents += lineGross;
    } else {
      merchNetCents += lineGross;
    }
  }

  const merchVatCents = Math.round(
    calculateVAT(merchNetCents / 100, merchVatRate) * 100
  );
  const shippingVatCents = Math.round(
    calculateVAT(shippingCost / 100, merchVatRate) * 100
  );

  const subtotalCents = merchNetCents + ticketGrossCents;
  const totalVatCents = merchVatCents + shippingVatCents + ticketVatCents;
  const finalTotalCents = subtotalCents + shippingCost + merchVatCents + shippingVatCents;

  return {
    subtotal: subtotalCents / 100,
    shipping: shippingCost / 100,
    vat: totalVatCents / 100,
    merchVat: merchVatCents / 100,
    shippingVat: shippingVatCents / 100,
    ticketVat: ticketVatCents / 100,
    ticketNet: ticketNetCents / 100,
    ticketGross: ticketGrossCents / 100,
    merchNet: merchNetCents / 100,
    total: finalTotalCents / 100,
  };
}

export function centsToEuros(cents: number): number {
  return Math.round(cents) / 100;
}
