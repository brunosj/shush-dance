import Stripe from 'stripe';

import { fromStripeCurrency } from '../../utilities/currency';
import {
  allocateStripeFeeEuros,
  retrieveStripeFeeLookupForTransactionId,
} from './stripeFees';

export type PriceEventInfo = {
  eventId: string;
  tierName: string;
  eventDate: string | null;
  eventLocation: string | null;
  eventTitle: string | null;
};

export type StripeEventLookups = {
  priceIdToInfo: Map<string, PriceEventInfo>;
  productIdToInfo: Map<string, PriceEventInfo>;
  catalogKeyToInfo: Map<string, PriceEventInfo>;
  eventIdToInfo: Map<string, PriceEventInfo>;
  tiersByEventAndLabel: Map<string, Map<string, PriceEventInfo>>;
};

export type ImportCheckoutSessionResult =
  | { status: 'created'; sessionId: string; transactionId: string }
  | { status: 'skipped'; sessionId: string; reason: string }
  | { status: 'error'; sessionId: string; error: string };

function normalizeTierLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function infoFromEventDoc(ev: any, tierName?: string): PriceEventInfo {
  const tiers = ev.ticketTiers;
  const firstTier = Array.isArray(tiers) && tiers.length > 0 ? tiers[0] : null;
  return {
    eventId: String(ev.id),
    tierName:
      tierName ||
      (typeof firstTier?.tierName === 'string' ? firstTier.tierName : null) ||
      'Ticket',
    eventDate: ev.date ?? null,
    eventLocation: ev.location ?? null,
    eventTitle: ev.title ?? null,
  };
}

function registerStripeCatalogId(
  raw: string | null | undefined,
  info: PriceEventInfo,
  lookups: Pick<StripeEventLookups, 'priceIdToInfo' | 'productIdToInfo'>,
): void {
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (!id) return;
  if (id.startsWith('price_') && !lookups.priceIdToInfo.has(id)) {
    lookups.priceIdToInfo.set(id, info);
  }
  if (id.startsWith('prod_') && !lookups.productIdToInfo.has(id)) {
    lookups.productIdToInfo.set(id, info);
  }
}

export async function buildStripeEventLookups(
  payload: any,
): Promise<StripeEventLookups> {
  const priceIdToInfo = new Map<string, PriceEventInfo>();
  const productIdToInfo = new Map<string, PriceEventInfo>();
  const catalogKeyToInfo = new Map<string, PriceEventInfo>();
  const eventIdToInfo = new Map<string, PriceEventInfo>();
  const tiersByEventAndLabel = new Map<string, Map<string, PriceEventInfo>>();
  const idLookups = { priceIdToInfo, productIdToInfo };

  const res = await payload.find({
    collection: 'events',
    limit: 300,
    depth: 0,
    overrideAccess: true,
  });

  for (const ev of res.docs || []) {
    const idStr = String(ev.id);
    eventIdToInfo.set(idStr, infoFromEventDoc(ev));

    const catalogRaw =
      typeof ev.stripeCatalogMatchKey === 'string'
        ? ev.stripeCatalogMatchKey.trim()
        : '';
    const matchKey = catalogRaw.toLowerCase();
    if (matchKey && !catalogKeyToInfo.has(matchKey)) {
      catalogKeyToInfo.set(matchKey, infoFromEventDoc(ev));
    }
    registerStripeCatalogId(catalogRaw, infoFromEventDoc(ev), idLookups);

    const tiers = ev.ticketTiers;
    if (!Array.isArray(tiers)) continue;

    if (!tiersByEventAndLabel.has(idStr)) {
      tiersByEventAndLabel.set(idStr, new Map());
    }
    const tierLabelMap = tiersByEventAndLabel.get(idStr)!;

    for (const tier of tiers) {
      const tname =
        typeof tier?.tierName === 'string' ? tier.tierName.trim() : '';
      if (tname) {
        const nk = normalizeTierLabel(tname);
        if (!tierLabelMap.has(nk)) {
          tierLabelMap.set(nk, infoFromEventDoc(ev, tier.tierName));
        }
      }
      registerStripeCatalogId(
        tier?.stripePriceId,
        infoFromEventDoc(ev, tier.tierName || undefined),
        idLookups,
      );
    }
  }

  return {
    priceIdToInfo,
    productIdToInfo,
    catalogKeyToInfo,
    eventIdToInfo,
    tiersByEventAndLabel,
  };
}

function isLiveStripeProduct(
  p: Stripe.Product | Stripe.DeletedProduct | null,
): p is Stripe.Product {
  return (
    !!p &&
    typeof p === 'object' &&
    !('deleted' in p && (p as Stripe.DeletedProduct).deleted)
  );
}

function resolveEventForLine(
  price: Stripe.Price,
  product: Stripe.Product | Stripe.DeletedProduct | null,
  lookups: StripeEventLookups,
): PriceEventInfo | undefined {
  const fromPriceMeta =
    price.metadata?.payload_event_id || price.metadata?.event_id;
  const pidTrim = typeof fromPriceMeta === 'string' ? fromPriceMeta.trim() : '';
  if (pidTrim && lookups.eventIdToInfo.has(pidTrim)) {
    return lookups.eventIdToInfo.get(pidTrim);
  }

  if (isLiveStripeProduct(product)) {
    const fromProductMeta =
      product.metadata?.payload_event_id || product.metadata?.event_id;
    const pmTrim =
      typeof fromProductMeta === 'string' ? fromProductMeta.trim() : '';
    if (pmTrim && lookups.eventIdToInfo.has(pmTrim)) {
      return lookups.eventIdToInfo.get(pmTrim);
    }
  }

  const byPriceId = lookups.priceIdToInfo.get(price.id);
  if (byPriceId) return byPriceId;

  const productId = isLiveStripeProduct(product)
    ? product.id
    : typeof price.product === 'string'
      ? price.product
      : null;
  if (productId) {
    const byProductId = lookups.productIdToInfo.get(productId);
    if (byProductId) return byProductId;
  }

  const ckRaw =
    price.metadata?.cms_event_key ||
    price.metadata?.cms_catalog_key ||
    (isLiveStripeProduct(product) &&
      (product.metadata?.cms_event_key || product.metadata?.cms_catalog_key));
  const ck = typeof ckRaw === 'string' ? ckRaw.trim().toLowerCase() : '';
  if (ck && lookups.catalogKeyToInfo.has(ck)) {
    return lookups.catalogKeyToInfo.get(ck);
  }

  return undefined;
}

function readStripeTierMetadataLabel(
  price: Stripe.Price,
  product: Stripe.Product | Stripe.DeletedProduct | null,
): string | undefined {
  const p =
    price.metadata?.cms_tier_name ||
    price.metadata?.cmsTierName ||
    price.metadata?.tier_name;
  if (typeof p === 'string' && p.trim()) return p.trim();
  if (isLiveStripeProduct(product)) {
    const pr =
      product.metadata?.cms_tier_name ||
      product.metadata?.cmsTierName ||
      product.metadata?.tier_name;
    if (typeof pr === 'string' && pr.trim()) return pr.trim();
  }
  return undefined;
}

function resolveEventForLineRefined(
  price: Stripe.Price,
  product: Stripe.Product | Stripe.DeletedProduct | null,
  lookups: StripeEventLookups,
): PriceEventInfo | undefined {
  const base = resolveEventForLine(price, product, lookups);
  const label = readStripeTierMetadataLabel(price, product);
  if (!base?.eventId || !label?.trim()) return base;
  const inner = lookups.tiersByEventAndLabel.get(base.eventId);
  if (!inner) return base;
  return inner.get(normalizeTierLabel(label)) || base;
}

async function listAllLineItems(
  stripe: Stripe,
  sessionId: string,
): Promise<Stripe.LineItem[]> {
  const items: Stripe.LineItem[] = [];
  let starting_after: string | undefined;
  for (;;) {
    const page = await stripe.checkout.sessions.listLineItems(sessionId, {
      limit: 100,
      starting_after,
      expand: ['data.price.product'],
    });
    items.push(...page.data);
    if (!page.has_more || page.data.length === 0) break;
    starting_after = page.data[page.data.length - 1].id;
  }
  return items;
}

async function resolvePriceForLineItem(
  stripe: Stripe,
  li: Stripe.LineItem,
): Promise<Stripe.Price | null> {
  const p = li.price as unknown;
  if (typeof p === 'string' && p.startsWith('price_')) {
    const retrieved = await stripe.prices.retrieve(p, {
      expand: ['product'],
    });
    const r = retrieved as unknown as { deleted?: boolean };
    if (r.deleted) return null;
    return retrieved as Stripe.Price;
  }
  if (typeof p === 'object' && p !== null) {
    const po = p as Stripe.Price & { deleted?: boolean };
    if (po.deleted) return null;
    if (po.id?.startsWith('price_')) return po;
  }
  return null;
}

function splitCustomerName(name: string | null | undefined): {
  firstName: string;
  lastName: string;
} {
  if (!name?.trim()) return { firstName: 'Customer', lastName: '-' };
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0], lastName: '-' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

function sessionCustomerEmail(session: Stripe.Checkout.Session): string {
  return (
    session.customer_details?.email?.trim() ||
    session.customer_email?.trim() ||
    ''
  );
}

export function paymentIntentIdFromSession(
  session: Stripe.Checkout.Session,
): string | null {
  const ref = session.payment_intent;
  if (typeof ref === 'string') return ref;
  return ref?.id || null;
}

async function checkoutSessionBuyerEmail(
  stripe: Stripe,
  session: Stripe.Checkout.Session,
): Promise<string> {
  let e = sessionCustomerEmail(session);
  if (e) return e;

  const cust = session.customer;
  if (typeof cust === 'string') {
    try {
      const c = await stripe.customers.retrieve(cust);
      const r = c as unknown as { deleted?: boolean; email?: string | null };
      if (!r.deleted && r.email?.trim()) return r.email.trim();
    } catch {
      // ignore
    }
  }

  const piId = paymentIntentIdFromSession(session);
  if (piId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(piId, {
        expand: ['latest_charge'],
      });
      if (pi.receipt_email?.trim()) return pi.receipt_email.trim();
      const meta =
        pi.metadata?.customer_email?.trim() || pi.metadata?.email?.trim() || '';
      if (meta) return meta;
      const lc = pi.latest_charge;
      if (typeof lc === 'object' && lc && 'billing_details' in lc) {
        const em = (lc as Stripe.Charge).billing_details?.email?.trim();
        if (em) return em;
      }
    } catch {
      // ignore
    }
  }

  return '';
}

/**
 * Import one paid Checkout Session (Payment Link / Checkout) as ticket-sales.
 * Idempotent on transactionId (PaymentIntent id or session id).
 */
export async function importPaidCheckoutSession(
  payload: any,
  stripe: Stripe,
  session: Stripe.Checkout.Session,
  eventLookups?: StripeEventLookups,
): Promise<ImportCheckoutSessionResult> {
  const sessionId = session.id;

  if (session.mode !== 'payment') {
    return { status: 'skipped', sessionId, reason: `mode=${session.mode}` };
  }

  if (
    session.payment_status !== 'paid' &&
    session.payment_status !== 'no_payment_required'
  ) {
    return {
      status: 'skipped',
      sessionId,
      reason: `payment_status=${session.payment_status}`,
    };
  }

  const email = await checkoutSessionBuyerEmail(stripe, session);
  if (!email) {
    return { status: 'skipped', sessionId, reason: 'no customer email' };
  }

  const paymentIntentId = paymentIntentIdFromSession(session);
  const transactionId = paymentIntentId || sessionId;

  const existing = await payload.find({
    collection: 'ticket-sales',
    where: { transactionId: { equals: transactionId } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  if (existing.docs?.length) {
    return { status: 'skipped', sessionId, reason: 'exists' };
  }

  const lookups = eventLookups || (await buildStripeEventLookups(payload));

  let lineItems: Stripe.LineItem[];
  try {
    lineItems = await listAllLineItems(stripe, sessionId);
  } catch (e: any) {
    return {
      status: 'error',
      sessionId,
      error: `line items — ${e?.message || e}`,
    };
  }

  const { firstName, lastName } = splitCustomerName(
    session.customer_details?.name,
  );

  const tickets: {
    cartItemId: string;
    ticketName: string;
    ticketDescription: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
    stripePriceId: string;
  }[] = [];
  const lineEventInfos: (PriceEventInfo | undefined)[] = [];

  let hadPricedLines = 0;
  let unmappedPricedLines = 0;

  for (const li of lineItems) {
    let price: Stripe.Price | null;
    try {
      price = await resolvePriceForLineItem(stripe, li);
    } catch (e: any) {
      return {
        status: 'error',
        sessionId,
        error: `price ${li.id} — ${e?.message || e}`,
      };
    }
    if (!price) continue;
    hadPricedLines += 1;

    const product =
      typeof price.product === 'object' && price.product
        ? (price.product as Stripe.Product | Stripe.DeletedProduct)
        : null;
    const qty = li.quantity || 1;
    const unitAmountCents = price.unit_amount ?? 0;
    const lineCents =
      li.amount_total ??
      (Number.isFinite(unitAmountCents) ? unitAmountCents * qty : 0);
    const unitCents = qty > 0 ? Math.round(lineCents / qty) : unitAmountCents;

    const stripeTierLabel = readStripeTierMetadataLabel(price, product);
    const lineInfo = resolveEventForLineRefined(price, product, lookups);
    if (!lineInfo) {
      unmappedPricedLines += 1;
      continue;
    }

    const tierFromPriceId = lookups.priceIdToInfo.get(price.id);
    const name =
      stripeTierLabel ||
      lineInfo.tierName ||
      tierFromPriceId?.tierName ||
      li.description ||
      (isLiveStripeProduct(product) ? product.name : null) ||
      price.nickname ||
      'Ticket';

    tickets.push({
      cartItemId: li.id,
      ticketName: name,
      ticketDescription: isLiveStripeProduct(product)
        ? product.description || ''
        : '',
      quantity: qty,
      unitPrice: unitCents / 100,
      lineTotal: lineCents / 100,
      stripePriceId: price.id,
    });
    lineEventInfos.push(lineInfo);
  }

  if (tickets.length === 0) {
    if (hadPricedLines > 0 && unmappedPricedLines === hadPricedLines) {
      return {
        status: 'skipped',
        sessionId,
        reason:
          'priced lines not mapped to any CMS event — set tier Stripe Price ID',
      };
    }
    return { status: 'skipped', sessionId, reason: 'no price_* line items' };
  }

  const subtotal = tickets.reduce((s, t) => s + t.lineTotal, 0);

  const eventIds = new Set<string>();
  for (const inf of lineEventInfos) {
    if (inf?.eventId) eventIds.add(inf.eventId);
  }
  if (eventIds.size > 1) {
    return {
      status: 'skipped',
      sessionId,
      reason: 'line items map to multiple CMS events; import separately',
    };
  }

  let primaryEventId: string | null = null;
  let primaryInfo: PriceEventInfo | undefined;
  if (eventIds.size === 1) {
    primaryEventId = [...eventIds][0];
    primaryInfo = lineEventInfos.find((inf) => inf?.eventId === primaryEventId);
  } else {
    primaryInfo = lineEventInfos.find(Boolean);
    primaryEventId = primaryInfo?.eventId || null;
  }

  const metaEventId =
    session.metadata &&
    (session.metadata.eventId ||
      session.metadata.event_id ||
      session.metadata.payloadEventId);
  if (!primaryEventId && metaEventId && typeof metaEventId === 'string') {
    const evLookup = await payload.find({
      collection: 'events',
      where: { id: { equals: metaEventId } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const doc = evLookup.docs?.[0] as
      | {
          id: string;
          date?: string | null;
          location?: string | null;
          title?: string | null;
        }
      | undefined;
    if (doc) {
      primaryEventId = String(doc.id);
      primaryInfo = {
        eventId: primaryEventId,
        tierName: tickets[0]?.ticketName || 'Ticket',
        eventDate: doc.date ?? null,
        eventLocation: doc.location ?? null,
        eventTitle: doc.title ?? null,
      };
    }
  }

  let pmNote = '';
  if (paymentIntentId) {
    try {
      const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
        expand: ['payment_method'],
      });
      const pm = pi.payment_method;
      if (typeof pm === 'object' && pm?.type) {
        pmNote = pm.type;
      }
    } catch {
      // ignore
    }
  }

  const internalNotes = [
    `Imported from Stripe Checkout (session ${sessionId}).`,
    pmNote ? `Payment method type: ${pmNote}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .trim();

  const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  try {
    const created = await payload.create({
      collection: 'ticket-sales',
      data: {
        ticketNumber,
        status: 'active',
        event: primaryEventId,
        ticketTier:
          primaryInfo?.tierName ||
          tickets[0]?.ticketName ||
          'General Admission',
        paymentMethod: 'stripe',
        paymentStatus: 'paid',
        transactionId,
        currency: fromStripeCurrency(session.currency),
        customerEmail: email,
        customerPhone: session.customer_details?.phone || '',
        firstName,
        lastName,
        tickets,
        ticketTotals: {
          subtotal,
          vat: 0,
          total: subtotal,
        },
        eventDate: primaryInfo?.eventDate || null,
        eventLocation: primaryInfo?.eventLocation || null,
        eventTitle: primaryInfo?.eventTitle || null,
        customerNotes: '',
        internalNotes,
      },
      overrideAccess: true,
    });

    // Best-effort: fee is often available immediately; cron backfill covers the rest.
    try {
      const lookup = await retrieveStripeFeeLookupForTransactionId(
        stripe,
        transactionId,
        { retries: 2, delayMs: 500 },
      );
      if (lookup && created?.id) {
        const allocated = allocateStripeFeeEuros(
          lookup.feeCents / 100,
          subtotal,
          lookup.amountCents / 100,
        );
        await payload.update({
          collection: 'ticket-sales',
          id: created.id,
          data: { stripeFee: allocated },
          overrideAccess: true,
        });
      }
    } catch {
      // Leave stripeFee empty; the periodic fee backfill will fill it.
    }

    return { status: 'created', sessionId, transactionId };
  } catch (e: any) {
    return {
      status: 'error',
      sessionId,
      error: `create — ${e?.message || e}`,
    };
  }
}
