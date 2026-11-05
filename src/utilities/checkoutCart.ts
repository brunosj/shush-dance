import {
  type BuyerAnswerSet,
  type BuyerQuestionDefsByLine,
  cartLineNeedsBuyerQuestions,
  getCartLineBuyerQuestions,
} from './buyerQuestions';

type CartLine = {
  quantity?: number;
  name?: string;
  product_data?: { metadata?: Record<string, unknown> };
};

export function cartNeedsTicketDetails(
  cartDetails: Record<string, CartLine | undefined> | null | undefined,
  defsByLine?: BuyerQuestionDefsByLine,
): boolean {
  if (!cartDetails) return false;
  return Object.entries(cartDetails).some(([lineId, item]) =>
    cartLineNeedsBuyerQuestions(
      item?.product_data?.metadata,
      lineId,
      defsByLine,
    ),
  );
}

/** Cart lines that still need CMS question defs (stale localStorage cart). */
export function cartLinesMissingBuyerQuestionMetadata(
  cartDetails: Record<string, CartLine | undefined> | null | undefined,
  defsByLine?: BuyerQuestionDefsByLine,
): { lineId: string; eventId: string; tierId: string }[] {
  if (!cartDetails) return [];
  const lines: { lineId: string; eventId: string; tierId: string }[] = [];
  for (const [lineId, item] of Object.entries(cartDetails)) {
    const metadata = item?.product_data?.metadata;
    if (!metadata || metadata.type !== 'ticket') continue;
    if (cartLineNeedsBuyerQuestions(metadata, lineId, defsByLine)) {
      continue;
    }
    const eventId =
      typeof metadata.eventId === 'string' ? metadata.eventId : '';
    const tierId = typeof metadata.tierId === 'string' ? metadata.tierId : '';
    if (eventId && tierId) {
      lines.push({ lineId, eventId, tierId });
    }
  }
  return lines;
}

/** Trim or pad answer sets when cart quantities change. */
export function syncTicketBuyerAnswersWithCart(
  cartDetails: Record<string, CartLine | undefined> | null | undefined,
  answers: Record<string, BuyerAnswerSet[]>,
  defsByLine?: BuyerQuestionDefsByLine,
): Record<string, BuyerAnswerSet[]> {
  if (!cartDetails) return {};
  const next: Record<string, BuyerAnswerSet[]> = {};

  for (const [lineId, item] of Object.entries(cartDetails)) {
    const qty = item?.quantity || 1;
    const questions = getCartLineBuyerQuestions(
      item?.product_data?.metadata,
      lineId,
      defsByLine,
    );
    if (questions.length === 0) continue;

    const prev = answers[lineId] || [];
    const sets: BuyerAnswerSet[] = [];
    for (let i = 0; i < qty; i++) {
      sets.push(prev[i] || []);
    }
    next[lineId] = sets;
  }

  return next;
}

export function areTicketBuyerAnswersComplete(
  cartDetails: Record<string, CartLine | undefined> | null | undefined,
  answers: Record<string, BuyerAnswerSet[]>,
  defsByLine?: BuyerQuestionDefsByLine,
): boolean {
  if (!cartDetails) return true;

  for (const [lineId, item] of Object.entries(cartDetails)) {
    const questions = getCartLineBuyerQuestions(
      item?.product_data?.metadata,
      lineId,
      defsByLine,
    );
    if (questions.length === 0) continue;

    const qty = item?.quantity || 1;
    const sets = answers[lineId];
    if (!sets || sets.length !== qty) return false;

    for (let u = 0; u < qty; u++) {
      const set = sets[u] || [];
      const byKey = new Map(set.map((e) => [e.key, e.value?.trim() || '']));
      for (const q of questions) {
        if (q.required !== false && !byKey.get(q.key)) {
          return false;
        }
        if (q.type === 'select' && byKey.get(q.key)) {
          const val = byKey.get(q.key)!;
          const allowed = (q.options || []).map((o) => o.value);
          if (!allowed.includes(val)) return false;
        }
      }
    }
  }

  return true;
}
