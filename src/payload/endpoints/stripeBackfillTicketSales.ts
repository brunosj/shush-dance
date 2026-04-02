import type { Endpoint } from 'payload/config';
import Stripe from 'stripe';

let stripeInstance: Stripe | null = null;
const getStripe = (): Stripe => {
  if (!stripeInstance) {
    stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      maxNetworkRetries: 2,
      timeout: 20000,
    });
  }
  return stripeInstance;
};

type PriceEventInfo = {
  eventId: string;
  tierName: string;
  eventDate: string | null;
  eventLocation: string | null;
  eventTitle: string | null;
};

function parseUnixSeconds(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const s = String(value).trim();
  if (/^\d{10,13}$/.test(s)) {
    const n = parseInt(s, 10);
    return s.length === 13 ? Math.floor(n / 1000) : n;
  }
  const d = new Date(s);
  const t = d.getTime();
  return Number.isNaN(t) ? null : Math.floor(t / 1000);
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

type StripeEventLookups = {
  priceIdToInfo: Map<string, PriceEventInfo>;
  catalogKeyToInfo: Map<string, PriceEventInfo>;
  eventIdToInfo: Map<string, PriceEventInfo>;
  /** eventId → normalized tier label → tier-specific row (for Stripe cms_tier_name matching). */
  tiersByEventAndLabel: Map<string, Map<string, PriceEventInfo>>;
};

function normalizeTierLabel(label: string): string {
  return label.trim().toLowerCase().replace(/\s+/g, ' ');
}

function infoFromEventDoc(ev: any, tierName?: string): PriceEventInfo {
  const tiers = ev.ticketTiers;
  const firstTier =
    Array.isArray(tiers) && tiers.length > 0 ? tiers[0] : null;
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

async function buildStripeEventLookups(
  payload: any
): Promise<StripeEventLookups> {
  const priceIdToInfo = new Map<string, PriceEventInfo>();
  const catalogKeyToInfo = new Map<string, PriceEventInfo>();
  const eventIdToInfo = new Map<string, PriceEventInfo>();
  const tiersByEventAndLabel = new Map<string, Map<string, PriceEventInfo>>();

  const res = await payload.find({
    collection: 'events',
    limit: 300,
    depth: 0,
  });

  for (const ev of res.docs || []) {
    const idStr = String(ev.id);
    eventIdToInfo.set(idStr, infoFromEventDoc(ev));

    const matchKey =
      typeof ev.stripeCatalogMatchKey === 'string'
        ? ev.stripeCatalogMatchKey.trim().toLowerCase()
        : '';
    if (matchKey && !catalogKeyToInfo.has(matchKey)) {
      catalogKeyToInfo.set(matchKey, infoFromEventDoc(ev));
    }

    const tiers = ev.ticketTiers;
    if (!Array.isArray(tiers)) continue;

    if (!tiersByEventAndLabel.has(idStr)) {
      tiersByEventAndLabel.set(idStr, new Map());
    }
    const tierLabelMap = tiersByEventAndLabel.get(idStr)!;

    for (const tier of tiers) {
      const tname = typeof tier?.tierName === 'string' ? tier.tierName.trim() : '';
      if (tname) {
        const nk = normalizeTierLabel(tname);
        if (!tierLabelMap.has(nk)) {
          tierLabelMap.set(nk, infoFromEventDoc(ev, tier.tierName));
        }
      }

      const pid = tier?.stripePriceId?.trim();
      if (pid && !priceIdToInfo.has(pid)) {
        priceIdToInfo.set(
          pid,
          infoFromEventDoc(ev, tier.tierName || undefined)
        );
      }
    }
  }

  return {
    priceIdToInfo,
    catalogKeyToInfo,
    eventIdToInfo,
    tiersByEventAndLabel,
  };
}

function isLiveStripeProduct(
  p: Stripe.Product | Stripe.DeletedProduct | null
): p is Stripe.Product {
  return (
    !!p &&
    typeof p === 'object' &&
    !('deleted' in p && (p as Stripe.DeletedProduct).deleted)
  );
}

/** Stripe Price/Product metadata + CMS tier price IDs → event. */
function resolveEventForLine(
  price: Stripe.Price,
  product: Stripe.Product | Stripe.DeletedProduct | null,
  lookups: StripeEventLookups
): PriceEventInfo | undefined {
  const fromPriceMeta =
    price.metadata?.payload_event_id || price.metadata?.event_id;
  const pidTrim =
    typeof fromPriceMeta === 'string' ? fromPriceMeta.trim() : '';
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

  const ckRaw =
    price.metadata?.cms_event_key ||
    price.metadata?.cms_catalog_key ||
    (isLiveStripeProduct(product) &&
      (product.metadata?.cms_event_key ||
        product.metadata?.cms_catalog_key));
  const ck = typeof ckRaw === 'string' ? ckRaw.trim().toLowerCase() : '';
  if (ck && lookups.catalogKeyToInfo.has(ck)) {
    return lookups.catalogKeyToInfo.get(ck);
  }

  return undefined;
}

function readStripeTierMetadataLabel(
  price: Stripe.Price,
  product: Stripe.Product | Stripe.DeletedProduct | null
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

/** After event is known (price id, catalog key, etc.), pick the CMS tier row that matches Stripe tier metadata. */
function refineLineEventInfo(
  base: PriceEventInfo | undefined,
  stripeTierLabel: string | undefined,
  lookups: StripeEventLookups
): PriceEventInfo | undefined {
  if (!base?.eventId || !stripeTierLabel?.trim()) return base;
  const inner = lookups.tiersByEventAndLabel.get(base.eventId);
  if (!inner) return base;
  const hit = inner.get(normalizeTierLabel(stripeTierLabel));
  return hit || base;
}

function resolveEventForLineRefined(
  price: Stripe.Price,
  product: Stripe.Product | Stripe.DeletedProduct | null,
  lookups: StripeEventLookups
): PriceEventInfo | undefined {
  const base = resolveEventForLine(price, product, lookups);
  const label = readStripeTierMetadataLabel(price, product);
  return refineLineEventInfo(base, label, lookups);
}

async function listAllLineItems(
  stripe: Stripe,
  sessionId: string
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

/** Stripe often returns `price` as a string id even when expand is requested — resolve to full Price. */
async function resolvePriceForLineItem(
  stripe: Stripe,
  li: Stripe.LineItem
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

function sessionCustomerEmail(session: Stripe.Checkout.Session): string {
  const a = session.customer_details?.email?.trim();
  if (a) return a;
  const b = session.customer_email?.trim();
  if (b) return b;
  return '';
}

function paymentIntentIdFromSession(
  session: Stripe.Checkout.Session
): string | null {
  const ref = session.payment_intent;
  if (typeof ref === 'string') return ref;
  return ref?.id || null;
}

/** Klarna and some wallets omit session email — resolve via Customer or PaymentIntent. */
async function checkoutSessionBuyerEmail(
  stripe: Stripe,
  session: Stripe.Checkout.Session
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
        pi.metadata?.customer_email?.trim() ||
        pi.metadata?.email?.trim() ||
        '';
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

function getOrderDataRawString(
  metadata: Stripe.Metadata | null | undefined
): string | null {
  if (!metadata) return null;
  let s = '';
  if (metadata.orderData) s = String(metadata.orderData);
  else if (metadata.orderDataChunks) {
    const n = parseInt(String(metadata.orderDataChunks), 10);
    if (!Number.isFinite(n) || n < 1) return null;
    for (let i = 0; i < n; i++) {
      s += metadata[`orderData_${i}`] ?? '';
    }
  } else {
    return null;
  }
  const t = s.trim();
  return t.length ? t : null;
}

function parseOrderDataTicketItems(raw: string): {
  orderData: Record<string, any>;
  ticketItems: any[];
} | null {
  const orderData = JSON.parse(raw) as Record<string, any>;
  const cartItems = Array.isArray(orderData.cartItems)
    ? orderData.cartItems
    : [];
  const ticketItems = cartItems.filter(
    (item: any) =>
      item.type === 'ticket' ||
      (item.metadata && item.metadata.type === 'ticket') ||
      (item.metadata && item.metadata.itemType === 'ticket')
  );
  if (ticketItems.length === 0) return null;
  return { orderData, ticketItems };
}

function paymentMethodTypeFromPi(
  pi: Stripe.PaymentIntent
): string | null {
  const pm = pi.payment_method;
  if (typeof pm === 'string') return null;
  if (!pm || typeof pm !== 'object') return null;
  const p = pm as Stripe.PaymentMethod & { deleted?: boolean };
  if (p.deleted) return null;
  return p.type || null;
}

async function createTicketSaleFromOrderDataPi(
  payload: any,
  pi: Stripe.PaymentIntent,
  parsed: { orderData: Record<string, any>; ticketItems: any[] },
  stripe: Stripe
): Promise<void> {
  const { orderData, ticketItems } = parsed;
  let pmType = 'unknown';
  try {
    const pmId =
      typeof pi.payment_method === 'string'
        ? pi.payment_method
        : pi.payment_method &&
            typeof pi.payment_method === 'object' &&
            'id' in pi.payment_method
          ? (pi.payment_method as Stripe.PaymentMethod).id
          : null;
    if (pmId) {
      const pm = await stripe.paymentMethods.retrieve(pmId);
      pmType = pm.type;
    }
  } catch {
    // ignore
  }
  const detectedPaymentMethod = pmType === 'paypal' ? 'paypal' : 'stripe';
  const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
  const ticketSubtotal =
    ticketItems.reduce(
      (sum: number, item: any) => sum + (item.lineTotal || 0),
      0
    ) / 100;
  const firstTicket = ticketItems[0];
  const eventMetadata = firstTicket?.metadata || {};
  const cd = orderData.customerData || {};
  const eventIdRaw =
    eventMetadata.eventId ||
    firstTicket?.eventId ||
    orderData.eventId ||
    null;
  const eventId =
    eventIdRaw != null && String(eventIdRaw).trim()
      ? String(eventIdRaw).trim()
      : null;

  await payload.create({
    collection: 'ticket-sales',
    data: {
      ticketNumber,
      status: 'active',
      event: eventId,
      ticketTier: firstTicket?.name || 'General Admission',
      paymentMethod: detectedPaymentMethod,
      paymentStatus: 'paid',
      transactionId: pi.id,
      customerEmail: cd.email,
      customerPhone: cd.phone || '',
      firstName: cd.firstName,
      lastName: cd.lastName,
      tickets: ticketItems.map((item: any) => {
        const priceIdFromCart =
          typeof item.id === 'string' && item.id.startsWith('price_')
            ? item.id
            : '';
        return {
          cartItemId: item.cartItemId || item.id,
          ticketName: item.name,
          ticketDescription: item.description,
          quantity: item.quantity,
          unitPrice: (item.unitPrice || 0) / 100,
          lineTotal: (item.lineTotal || 0) / 100,
          stripePriceId: item.stripePriceId || priceIdFromCart || '',
        };
      }),
      ticketTotals: {
        subtotal: ticketSubtotal,
        vat: 0,
        total: ticketSubtotal,
      },
      eventDate: eventMetadata.eventDate || null,
      eventLocation: eventMetadata.eventLocation || null,
      eventTitle:
        eventMetadata.eventTitle || firstTicket?.parentItem || null,
      customerNotes: cd.customerNotes || '',
      internalNotes: `Backfilled from PaymentIntent orderData metadata: ${pi.id}.`,
    },
  });
}

async function createGenericKlarnaTicketSale(
  payload: any,
  pi: Stripe.PaymentIntent,
  eventLookups: StripeEventLookups
): Promise<void> {
  let email =
    pi.receipt_email?.trim() ||
    pi.metadata?.customer_email?.trim() ||
    pi.metadata?.email?.trim() ||
    '';
  const ch = pi.latest_charge;
  if (!email && typeof ch === 'object' && ch && 'billing_details' in ch) {
    email = (ch as Stripe.Charge).billing_details?.email?.trim() || '';
  }
  if (!email) {
    throw new Error('No customer email on Klarna PaymentIntent');
  }

  let primaryInfo: PriceEventInfo | undefined;
  let primaryEventId: string | null = null;
  const mid =
    pi.metadata?.payload_event_id || pi.metadata?.event_id;
  if (mid && typeof mid === 'string') {
    primaryInfo = eventLookups.eventIdToInfo.get(mid.trim());
    if (primaryInfo) primaryEventId = primaryInfo.eventId;
  }
  const ckRaw =
    pi.metadata?.cms_event_key || pi.metadata?.cms_catalog_key;
  const ck =
    typeof ckRaw === 'string' ? ckRaw.trim().toLowerCase() : '';
  if (!primaryEventId && ck) {
    primaryInfo = eventLookups.catalogKeyToInfo.get(ck);
    if (primaryInfo) primaryEventId = primaryInfo.eventId;
  }

  const cents = pi.amount_received ?? pi.amount ?? 0;
  const total = cents / 100;
  let nameSource = '';
  if (typeof ch === 'object' && ch && 'billing_details' in ch) {
    nameSource =
      (ch as Stripe.Charge).billing_details?.name?.trim() || '';
  }
  const { firstName, lastName } = splitCustomerName(
    nameSource || undefined
  );

  const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

  await payload.create({
    collection: 'ticket-sales',
    data: {
      ticketNumber,
      status: 'active',
      event: primaryEventId,
      ticketTier:
        primaryInfo?.tierName || 'Klarna (imported)',
      paymentMethod: 'stripe',
      paymentStatus: 'paid',
      transactionId: pi.id,
      customerEmail: email,
      customerPhone:
        (typeof ch === 'object' && ch && 'billing_details' in ch
          ? (ch as Stripe.Charge).billing_details?.phone
          : '') || '',
      firstName,
      lastName,
      tickets: [
        {
          cartItemId: `klarna_${pi.id}`,
          ticketName: 'Klarna (imported)',
          ticketDescription:
            'Imported from PaymentIntent; tier detail may be generic — verify in Stripe.',
          quantity: 1,
          unitPrice: total,
          lineTotal: total,
          stripePriceId: '',
        },
      ],
      ticketTotals: {
        subtotal: total,
        vat: 0,
        total,
      },
      eventDate: primaryInfo?.eventDate || null,
      eventLocation: primaryInfo?.eventLocation || null,
      eventTitle: primaryInfo?.eventTitle || null,
      customerNotes: '',
      internalNotes: `Backfilled from Klarna PaymentIntent ${pi.id} (no Checkout Session line items in sync). Link event via Stripe metadata payload_event_id / cms_event_key on the PaymentIntent if needed.`,
    },
  });
}

export const stripeBackfillTicketSalesEndpoint: Endpoint = {
  path: '/sync-stripe-ticket-sales',
  method: 'post',
  handler: async (req, res) => {
    const apiKey = req.headers['x-api-key'] || req.query?.key;
    const expectedKey =
      process.env.STRIPE_TICKET_BACKFILL_KEY || process.env.MONITOR_API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      return res.status(401).json({
        ok: false,
        error: 'Unauthorized',
      });
    }

    if (!process.env.STRIPE_SECRET_KEY) {
      return res.status(500).json({
        ok: false,
        error: 'STRIPE_SECRET_KEY not configured',
      });
    }

    let body: Record<string, unknown> = {};
    if (req.body != null) {
      if (typeof req.body === 'string') {
        try {
          body = JSON.parse(req.body) as Record<string, unknown>;
        } catch {
          body = {};
        }
      } else if (typeof req.body === 'object') {
        body = req.body as Record<string, unknown>;
      }
    }
    const sinceRaw = body.since ?? req.query?.since;
    const untilRaw = body.until ?? req.query?.until;

    const sinceSec = parseUnixSeconds(sinceRaw);
    if (sinceSec === null) {
      return res.status(400).json({
        ok: false,
        error: 'Missing or invalid "since" (ISO date or unix seconds)',
      });
    }

    let untilSec = parseUnixSeconds(untilRaw);
    if (untilSec === null) untilSec = Math.floor(Date.now() / 1000);
    if (untilSec < sinceSec) {
      return res.status(400).json({
        ok: false,
        error: '"until" must be on or after "since"',
      });
    }

    const stripe = getStripe();
    const eventLookups = await buildStripeEventLookups(req.payload);

    const created: string[] = [];
    const skipped: string[] = [];
    const errors: string[] = [];
    let checkoutSessionsListed = 0;

    const stripeKey = process.env.STRIPE_SECRET_KEY || '';
    const stripeKeyMode = stripeKey.startsWith('sk_test_')
      ? 'test'
      : stripeKey.startsWith('sk_live_')
        ? 'live'
        : 'unknown';

    /** Every Checkout Session PI — used to avoid double-importing Klarna PIs. */
    const sessionPaymentIntentIds = new Set<string>();

    let sessionStartingAfter: string | undefined;
    for (;;) {
      const page = await stripe.checkout.sessions.list({
        created: { gte: sinceSec, lte: untilSec },
        status: 'complete',
        limit: 100,
        starting_after: sessionStartingAfter,
      });

      checkoutSessionsListed += page.data.length;

      for (const session of page.data) {
        const piEarly = paymentIntentIdFromSession(session);
        if (piEarly) sessionPaymentIntentIds.add(piEarly);

        if (session.mode !== 'payment') {
          skipped.push(`${session.id} (mode=${session.mode})`);
          continue;
        }

        if (
          session.payment_status !== 'paid' &&
          session.payment_status !== 'no_payment_required'
        ) {
          skipped.push(
            `${session.id} (payment_status=${session.payment_status})`
          );
          continue;
        }

        const email = await checkoutSessionBuyerEmail(stripe, session);
        if (!email) {
          skipped.push(`${session.id} (no customer email)`);
          continue;
        }

        const paymentIntentId = piEarly;
        const transactionId = paymentIntentId || session.id;

        const existing = await req.payload.find({
          collection: 'ticket-sales',
          where: { transactionId: { equals: transactionId } },
          limit: 1,
          depth: 0,
        });
        if (existing.docs?.length) {
          skipped.push(`${session.id} (exists)`);
          continue;
        }

        let lineItems: Stripe.LineItem[];
        try {
          lineItems = await listAllLineItems(stripe, session.id);
        } catch (e: any) {
          errors.push(`${session.id}: line items — ${e?.message || e}`);
          continue;
        }

        const { firstName, lastName } = splitCustomerName(
          session.customer_details?.name
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

        for (const li of lineItems) {
          let price: Stripe.Price | null;
          try {
            price = await resolvePriceForLineItem(stripe, li);
          } catch (e: any) {
            errors.push(`${session.id}: price ${li.id} — ${e?.message || e}`);
            price = null;
          }
          if (!price) continue;

          const product =
            typeof price.product === 'object' && price.product
              ? (price.product as Stripe.Product | Stripe.DeletedProduct)
              : null;
          const qty = li.quantity || 1;
          const unitAmountCents = price.unit_amount ?? 0;
          const lineCents =
            li.amount_total ??
            (Number.isFinite(unitAmountCents) ? unitAmountCents * qty : 0);
          const unitCents =
            qty > 0 ? Math.round(lineCents / qty) : unitAmountCents;

          const stripeTierLabel = readStripeTierMetadataLabel(price, product);
          const lineInfo = resolveEventForLineRefined(
            price,
            product,
            eventLookups
          );
          const tierFromPriceId = eventLookups.priceIdToInfo.get(price.id);
          const name =
            stripeTierLabel ||
            lineInfo?.tierName ||
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
          skipped.push(`${session.id} (no price_* line items)`);
          continue;
        }

        const subtotal = tickets.reduce((s, t) => s + t.lineTotal, 0);

        const eventIds = new Set<string>();
        for (let i = 0; i < tickets.length; i++) {
          const id = lineEventInfos[i]?.eventId;
          if (id) eventIds.add(id);
        }

        let primaryEventId: string | null = null;
        let primaryInfo: PriceEventInfo | undefined;
        if (eventIds.size === 1) {
          primaryEventId = [...eventIds][0];
          const idx = lineEventInfos.findIndex(
            (inf) => inf?.eventId === primaryEventId
          );
          primaryInfo = idx >= 0 ? lineEventInfos[idx] : undefined;
        } else {
          for (const inf of lineEventInfos) {
            if (inf) {
              primaryEventId = inf.eventId;
              primaryInfo = inf;
              break;
            }
          }
        }

        const metaEventId =
          session.metadata &&
          (session.metadata.eventId ||
            session.metadata.event_id ||
            session.metadata.payloadEventId);
        if (!primaryEventId && metaEventId && typeof metaEventId === 'string') {
          const evLookup = await req.payload.find({
            collection: 'events',
            where: { id: { equals: metaEventId } },
            limit: 1,
            depth: 0,
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

        let multiEventNote = '';
        if (eventIds.size > 1 && primaryInfo) {
          multiEventNote = ` Multiple line items map to different CMS events; linked to first matched (${primaryInfo.eventTitle || primaryEventId}).`;
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
          `Backfilled from Stripe Checkout (session ${session.id}).`,
          pmNote ? `Payment method type: ${pmNote}.` : '',
          multiEventNote.trim(),
        ]
          .filter(Boolean)
          .join(' ')
          .trim();

        const ticketNumber = `TICKET-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

        try {
          await req.payload.create({
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
          });
          created.push(session.id);
        } catch (e: any) {
          errors.push(`${session.id}: create — ${e?.message || e}`);
        }
      }

      if (!page.has_more || page.data.length === 0) break;
      sessionStartingAfter = page.data[page.data.length - 1].id;
    }

    let paymentIntentsListed = 0;
    let piStartingAfter: string | undefined;
    for (;;) {
      const piPage = await stripe.paymentIntents.list({
        created: { gte: sinceSec, lte: untilSec },
        limit: 100,
        starting_after: piStartingAfter,
      });

      paymentIntentsListed += piPage.data.length;

      for (const row of piPage.data) {
        if (row.status !== 'succeeded') continue;

        const existingPi = await req.payload.find({
          collection: 'ticket-sales',
          where: { transactionId: { equals: row.id } },
          limit: 1,
          depth: 0,
        });
        if (existingPi.docs?.length) continue;

        const fullPi = await stripe.paymentIntents.retrieve(row.id, {
          expand: ['payment_method', 'latest_charge'],
        });

        const rawOrder = getOrderDataRawString(fullPi.metadata);
        if (rawOrder) {
          let parsed: {
            orderData: Record<string, any>;
            ticketItems: any[];
          } | null = null;
          try {
            parsed = parseOrderDataTicketItems(rawOrder);
          } catch (e: any) {
            errors.push(
              `${row.id}: orderData JSON parse — ${e?.message || e}`
            );
            continue;
          }
          if (parsed && parsed.ticketItems.length > 0) {
            try {
              await createTicketSaleFromOrderDataPi(
                req.payload,
                fullPi,
                parsed,
                stripe
              );
              created.push(`pi:${row.id}`);
            } catch (e: any) {
              errors.push(`${row.id}: orderData PI — ${e?.message || e}`);
            }
            continue;
          }
          errors.push(
            `${row.id}: orderData present but no ticket lines in cartItems`
          );
          continue;
        }

        if (sessionPaymentIntentIds.has(row.id)) continue;

        if (paymentMethodTypeFromPi(fullPi) !== 'klarna') continue;

        try {
          await createGenericKlarnaTicketSale(
            req.payload,
            fullPi,
            eventLookups
          );
          created.push(`klarna:${row.id}`);
        } catch (e: any) {
          errors.push(`${row.id}: klarna PI — ${e?.message || e}`);
        }
      }

      if (!piPage.has_more || piPage.data.length === 0) break;
      piStartingAfter = piPage.data[piPage.data.length - 1].id;
    }

    return res.status(200).json({
      ok: true,
      created: created.length,
      skipped: skipped.length,
      errors: errors.length,
      createdSessionIds: created,
      skippedSessionIds: skipped,
      errorMessages: errors,
      checkoutSessionsListed,
      paymentIntentsListed,
      stripeKeyMode,
      window: {
        sinceUnix: sinceSec,
        untilUnix: untilSec,
        sinceIso: new Date(sinceSec * 1000).toISOString(),
        untilIso: new Date(untilSec * 1000).toISOString(),
      },
    });
  },
};
