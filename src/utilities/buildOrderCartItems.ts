import type { BuyerAnswerSet } from './buyerQuestions';

type CartDetails = Record<
  string,
  | {
      name?: string;
      description?: string;
      quantity?: number;
      price?: number;
      parentItem?: string | null;
      product_data?: { metadata?: Record<string, unknown> };
    }
  | undefined
>;

export function buildOrderCartItemsFromCart(
  cartDetails: CartDetails | null | undefined,
  ticketBuyerAnswers: Record<string, BuyerAnswerSet[]> = {}
) {
  return Object.entries(cartDetails || {}).map(([key, item]) => {
    const metadata = { ...(item?.product_data?.metadata || {}) };
    const answerSets = ticketBuyerAnswers[key];
    if (answerSets?.length) {
      metadata.buyerAnswerSets = answerSets;
    }

    return {
      id: key,
      name: item?.name,
      description: item?.description,
      quantity: item?.quantity,
      unitPrice: item?.price,
      lineTotal: (item?.price || 0) * (item?.quantity || 1),
      type: (metadata.type as string) || 'merch',
      metadata,
      parentItem: item?.parentItem || null,
      tierId: (metadata.tierId as string) || null,
      stripePriceId: (metadata.stripePriceId as string) || null,
      buyerAnswerSets: answerSets,
    };
  });
}
