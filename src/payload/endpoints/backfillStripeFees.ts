import type { Endpoint } from 'payload';

import { backfillStripeFees } from '../utils/backfillStripeFees';

export const backfillStripeFeesEndpoint: Endpoint = {
  path: '/backfill-stripe-fees',
  method: 'post',
  handler: async (req) => {
    const apiKey =
      req.headers.get('x-api-key') || req.searchParams.get('key');
    const expectedKey =
      process.env.STRIPE_TICKET_BACKFILL_KEY || process.env.MONITOR_API_KEY;
    if (!expectedKey || apiKey !== expectedKey) {
      return Response.json({
        ok: false,
        error: 'Unauthorized',
      }, { status: 401 });
    }

    let body: Record<string, unknown> = {};
    try {
      body = (await req.json()) as Record<string, unknown>;
    } catch {
      body = {};
    }

    const dryRun =
      body.dryRun === true || req.searchParams.get('dryRun') === 'true';
    const force =
      body.force === true || req.searchParams.get('force') === 'true';
    const limitRaw = body.limit ?? req.searchParams.get('limit');
    const limit =
      typeof limitRaw === 'number'
        ? limitRaw
        : typeof limitRaw === 'string'
          ? parseInt(limitRaw, 10)
          : undefined;

    try {
      const result = await backfillStripeFees(req.payload, {
        dryRun,
        force,
        limit: Number.isFinite(limit) ? limit : undefined,
      });
      return Response.json(result);;
    } catch (error: any) {
      console.error('❌ Stripe fee backfill failed:', error);
      return Response.json({
        ok: false,
        error: error?.message || 'Stripe fee backfill failed',
      }, { status: 500 });
    }
  },
};
