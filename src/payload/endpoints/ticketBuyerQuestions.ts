import type { Endpoint } from 'payload/config';

import { normalizeBuyerQuestionDefs } from '../../utilities/buyerQuestions';

type LineRequest = { lineId?: unknown; eventId?: unknown; tierId?: unknown };

function asId(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Buyer-question defs for cart lines whose localStorage snapshot predates
 * `buyerQuestionsJson`. Must live on the Payload router: the custom server
 * does not forward unmatched `/api` requests to Next.js.
 */
export const ticketBuyerQuestionsEndpoint: Endpoint = {
  path: '/checkout/ticket-buyer-questions',
  method: 'post',
  handler: async (req, res) => {
    try {
      const lines = Array.isArray(req.body?.lines)
        ? (req.body.lines as LineRequest[])
        : [];
      if (lines.length > 50) {
        return res.status(400).json({ error: 'Too many cart lines' });
      }

      const questionsByLineId: Record<
        string,
        ReturnType<typeof normalizeBuyerQuestionDefs>
      > = {};
      const eventCache = new Map<string, Record<string, unknown> | null>();

      for (const line of lines) {
        const lineId = asId(line?.lineId);
        const eventId = asId(line?.eventId);
        const tierId = asId(line?.tierId);
        if (!lineId || !eventId || !tierId) continue;
        if (lineId.length > 200 || eventId.length > 64 || tierId.length > 64) {
          continue;
        }

        let event = eventCache.get(eventId);
        if (event === undefined) {
          try {
            event = (await req.payload.findByID({
              collection: 'events',
              id: eventId,
              depth: 0,
              overrideAccess: true,
            })) as Record<string, unknown>;
          } catch {
            event = null;
          }
          eventCache.set(eventId, event);
        }

        const tiers = Array.isArray(event?.ticketTiers)
          ? event.ticketTiers
          : [];
        const tier = tiers.find(
          (entry: { id?: string }) => entry?.id === tierId,
        ) as { buyerQuestions?: unknown } | undefined;
        questionsByLineId[lineId] = tier
          ? normalizeBuyerQuestionDefs(tier.buyerQuestions)
          : [];
      }

      return res.status(200).json({ questionsByLineId });
    } catch (error) {
      console.error('Failed to load ticket buyer questions:', error);
      return res
        .status(500)
        .json({ error: 'Failed to load ticket questions.' });
    }
  },
};
