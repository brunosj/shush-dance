import { NextResponse } from 'next/server';

import {
  type BuyerQuestionDef,
  normalizeBuyerQuestionDefs,
} from '../../../../utilities/buyerQuestions';

type LineRequest = { lineId: string; eventId: string; tierId: string };

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { lines?: LineRequest[] };
    const lines = Array.isArray(body.lines) ? body.lines : [];
    if (lines.length === 0) {
      return NextResponse.json({ questionsByLineId: {} });
    }

    const base = process.env.NEXT_PUBLIC_PAYLOAD_URL;
    const apiKey = process.env.PAYLOAD_API_KEY;
    if (!base || !apiKey) {
      return NextResponse.json(
        { error: 'Ticket questions are not configured on the server.' },
        { status: 500 },
      );
    }

    const eventCache = new Map<string, Record<string, unknown>>();
    const questionsByLineId: Record<string, BuyerQuestionDef[]> = {};

    for (const line of lines) {
      if (!line.lineId || !line.eventId || !line.tierId) continue;

      let event = eventCache.get(line.eventId);
      if (!event) {
        const res = await fetch(
          `${base}/api/events/${encodeURIComponent(line.eventId)}?depth=0`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `users API-Key ${apiKey}`,
            },
            cache: 'no-store',
          },
        );
        if (!res.ok) continue;
        event = (await res.json()) as Record<string, unknown>;
        eventCache.set(line.eventId, event);
      }

      const tiers = Array.isArray(event.ticketTiers) ? event.ticketTiers : [];
      const tier = tiers.find((t: { id?: string }) => t?.id === line.tierId) as
        | { buyerQuestions?: unknown }
        | undefined;
      if (!tier) continue;

      const questions = normalizeBuyerQuestionDefs(tier.buyerQuestions);
      if (questions.length > 0) {
        questionsByLineId[line.lineId] = questions;
      }
    }

    return NextResponse.json({ questionsByLineId });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load ticket questions.' },
      { status: 500 },
    );
  }
}
