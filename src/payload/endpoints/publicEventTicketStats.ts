import type { Endpoint } from 'payload';

import {
  type CheckoutCurrency,
  DEFAULT_CURRENCY,
  normalizeCurrency,
} from '../../utilities/currency';

const DEFAULT_ALLOWED_SLUGS = ['shush-x-shai-space'];

function allowedSlugs(): Set<string> {
  const raw = process.env.PUBLIC_EVENT_TRACKER_SLUGS?.trim();
  if (!raw) return new Set(DEFAULT_ALLOWED_SLUGS);
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function trackerKeyOk(req: {
  headers: Headers;
  searchParams: URLSearchParams;
}): boolean {
  const expected = process.env.PUBLIC_EVENT_TRACKER_KEY?.trim();
  if (!expected) return true;
  const fromHeader = req.headers.get('x-tracker-key');
  const fromQuery = req.searchParams.get('key');
  const provided = fromHeader || fromQuery || '';
  return provided === expected;
}

type TierAgg = {
  name: string;
  quantity: number;
  orders: number;
  revenue: number;
};

/**
 * Public, aggregate-only ticket stats for allowlisted events.
 * No customer PII. Optional gate: PUBLIC_EVENT_TRACKER_KEY.
 */
export const publicEventTicketStatsEndpoint: Endpoint = {
  path: '/public-event-ticket-stats',
  method: 'get',
  handler: async (req) => {
    try {
      if (!trackerKeyOk(req)) {
        return Response.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
      }

      const slugRaw = req.searchParams.get('slug');
      const slug =
        typeof slugRaw === 'string' ? slugRaw.trim().toLowerCase() : '';
      if (!slug) {
        return Response.json({ ok: false, error: 'Missing slug' }, { status: 400 });
      }

      if (!allowedSlugs().has(slug)) {
        return Response.json({ ok: false, error: 'Not found' }, { status: 404 });
      }

      const eventRes = await req.payload.find({
        collection: 'events',
        where: { slug: { equals: slug } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      });
      const event = eventRes.docs?.[0] as
        | {
            id: string;
            title?: string | null;
            date?: string | null;
            location?: string | null;
            currency?: string | null;
            ticketTiers?: { tierName?: string | null }[] | null;
          }
        | undefined;

      if (!event?.id) {
        return Response.json({ ok: false, error: 'Event not found' }, { status: 404 });
      }

      const salesRes = await req.payload.find({
        collection: 'ticket-sales',
        where: {
          and: [
            { event: { equals: event.id } },
            { paymentStatus: { equals: 'paid' } },
          ],
        },
        limit: 2000,
        depth: 0,
        overrideAccess: true,
      });

      const currency: CheckoutCurrency = normalizeCurrency(
        event.currency || DEFAULT_CURRENCY,
      );

      const tiers: Record<string, TierAgg> = {};
      let totalTickets = 0;
      let totalOrders = 0;
      let totalRevenue = 0;

      for (const sale of salesRes.docs || []) {
        const s = sale as {
          tickets?: {
            ticketName?: string | null;
            quantity?: number | null;
            lineTotal?: number | null;
          }[];
          ticketTotals?: { total?: number | null };
          ticketTier?: string | null;
          currency?: string | null;
        };

        totalOrders += 1;
        const saleTotal =
          typeof s.ticketTotals?.total === 'number'
            ? s.ticketTotals.total
            : (s.tickets || []).reduce(
                (sum, t) => sum + (Number(t.lineTotal) || 0),
                0,
              );
        totalRevenue += saleTotal;

        const lines = s.tickets || [];
        if (lines.length === 0) {
          const name = s.ticketTier || 'Ticket';
          if (!tiers[name]) {
            tiers[name] = { name, quantity: 0, orders: 0, revenue: 0 };
          }
          tiers[name].orders += 1;
          tiers[name].revenue += saleTotal;
          continue;
        }

        const namesInSale = new Set<string>();
        for (const line of lines) {
          const name = (line.ticketName || s.ticketTier || 'Ticket').trim();
          const qty = Number(line.quantity) || 0;
          const lineTotal = Number(line.lineTotal) || 0;
          if (!tiers[name]) {
            tiers[name] = { name, quantity: 0, orders: 0, revenue: 0 };
          }
          tiers[name].quantity += qty;
          tiers[name].revenue += lineTotal;
          totalTickets += qty;
          namesInSale.add(name);
        }
        for (const name of namesInSale) {
          tiers[name].orders += 1;
        }
      }

      const tierList = Object.values(tiers).sort((a, b) =>
        a.name.localeCompare(b.name),
      );

      // If CMS defines tiers with zero sales, still list them at 0.
      for (const t of event.ticketTiers || []) {
        const name = (t.tierName || '').trim();
        if (name && !tiers[name]) {
          tierList.push({ name, quantity: 0, orders: 0, revenue: 0 });
        }
      }

      return Response.json({
        ok: true,
        generatedAt: new Date().toISOString(),
        event: {
          id: event.id,
          slug,
          title: event.title || slug,
          date: event.date || null,
          location: event.location || null,
          currency,
        },
        totals: {
          tickets: totalTickets,
          orders: totalOrders,
          revenue: Math.round(totalRevenue * 100) / 100,
        },
        tiers: tierList,
      });
    } catch (error) {
      return Response.json({
        ok: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }, { status: 500 });
    }
  },
};
