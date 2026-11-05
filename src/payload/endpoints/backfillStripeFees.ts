import type { Endpoint } from 'payload/config';

import { backfillStripeFees } from '../utils/backfillStripeFees';

export const backfillStripeFeesEndpoint: Endpoint = {
  path: '/backfill-stripe-fees',
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

    const dryRun = body.dryRun === true || req.query?.dryRun === 'true';
    const force = body.force === true || req.query?.force === 'true';
    const limitRaw = body.limit ?? req.query?.limit;
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
      return res.json(result);
    } catch (error: any) {
      console.error('❌ Stripe fee backfill failed:', error);
      return res.status(500).json({
        ok: false,
        error: error?.message || 'Stripe fee backfill failed',
      });
    }
  },
};
