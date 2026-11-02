import type { TicketSale } from '../payload/payload-types';

export type TicketAnswersExportRow = Record<string, string | number>;

type TicketLine = TicketSale['tickets'][number];

type PayloadAnswerSet = NonNullable<TicketLine['answerSets']>[number];

function formatOrderDateTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function normalizeUnitAnswers(
  answerSet: PayloadAnswerSet | undefined
): { key: string; label: string; value: string }[] {
  if (!answerSet?.answers?.length) return [];
  return answerSet.answers.map((a) => ({
    key: a.key,
    label: a.label,
    value: typeof a.value === 'string' ? a.value : '',
  }));
}

export function ticketLineHasCheckoutAnswers(line: TicketLine): boolean {
  if (!Array.isArray(line.answerSets) || line.answerSets.length === 0) {
    return false;
  }
  return line.answerSets.some(
    (set) => normalizeUnitAnswers(set).length > 0
  );
}

export function collectQuestionLabelsFromSales(
  ticketSales: TicketSale[]
): string[] {
  const labels = new Set<string>();
  for (const sale of ticketSales) {
    for (const line of sale.tickets || []) {
      if (!ticketLineHasCheckoutAnswers(line)) continue;
      for (const set of line.answerSets || []) {
        for (const a of normalizeUnitAnswers(set)) {
          if (a.label.trim()) labels.add(a.label.trim());
        }
      }
    }
  }
  return [...labels].sort((a, b) => a.localeCompare(b));
}

export type CheckoutAnswersExportResult = {
  rows: TicketAnswersExportRow[];
  questionColumns: string[];
};

export function buildCheckoutAnswersExportRows(
  ticketSales: TicketSale[],
  eventMeta: {
    title: string;
    date?: string | null;
    location?: string | null;
  }
): CheckoutAnswersExportResult {
  const questionColumns = collectQuestionLabelsFromSales(ticketSales);
  const rows: TicketAnswersExportRow[] = [];

  for (const sale of ticketSales) {
    for (const line of sale.tickets || []) {
      if (!ticketLineHasCheckoutAnswers(line)) continue;

      const sets = line.answerSets || [];
      const totalUnits = line.quantity || sets.length || 1;

      for (let unitIndex = 0; unitIndex < sets.length; unitIndex++) {
        const unitAnswers = normalizeUnitAnswers(sets[unitIndex]);
        const byLabel = new Map<string, string>();
        for (const a of unitAnswers) {
          if (a.label.trim()) {
            byLabel.set(a.label.trim(), a.value);
          }
        }

        const row: TicketAnswersExportRow = {
          'Ticket Number': sale.ticketNumber,
          'Order Date': formatOrderDateTime(sale.createdAt),
          'First Name': sale.firstName,
          'Last Name': sale.lastName,
          Email: sale.customerEmail,
          Phone: sale.customerPhone || '',
          Event: eventMeta.title,
          Tier: line.ticketName,
          Unit: `${unitIndex + 1} of ${totalUnits}`,
          Status: sale.status,
          'Payment Status': sale.paymentStatus,
        };

        for (const label of questionColumns) {
          row[label] = byLabel.get(label) ?? '';
        }

        rows.push(row);
      }
    }
  }

  return { rows, questionColumns };
}
