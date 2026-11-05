export type BuyerQuestionType = 'select' | 'text' | 'textarea';

export type BuyerQuestionDef = {
  key: string;
  label: string;
  type: BuyerQuestionType;
  required?: boolean | null;
  helpText?: string | null;
  options?: { value: string; id?: string }[] | null;
};

export type BuyerAnswerEntry = {
  key: string;
  label: string;
  value: string;
};

/** One set of answers per ticket unit (same order as CMS questions). */
export type BuyerAnswerSet = BuyerAnswerEntry[];

export function normalizeBuyerQuestionDefs(raw: unknown): BuyerQuestionDef[] {
  if (!Array.isArray(raw)) return [];
  const out: BuyerQuestionDef[] = [];
  for (const row of raw) {
    if (!row || typeof row !== 'object') continue;
    const r = row as Record<string, unknown>;
    const key = typeof r.key === 'string' ? r.key.trim() : '';
    const label = typeof r.label === 'string' ? r.label.trim() : '';
    const type = r.type as BuyerQuestionType;
    if (!key || !label) continue;
    if (type !== 'select' && type !== 'text' && type !== 'textarea') continue;
    const options = Array.isArray(r.options)
      ? r.options
          .map((o) => {
            if (!o || typeof o !== 'object') return null;
            const v = (o as { value?: string }).value;
            return typeof v === 'string' && v.trim() ? v.trim() : null;
          })
          .filter((v): v is string => Boolean(v))
          .map((value) => ({ value }))
      : [];
    out.push({
      key,
      label,
      type,
      required: r.required !== false,
      helpText:
        typeof r.helpText === 'string' && r.helpText.trim()
          ? r.helpText.trim()
          : null,
      options: type === 'select' ? options : null,
    });
  }
  return out;
}

export function parseBuyerQuestionsJson(json: unknown): BuyerQuestionDef[] {
  if (typeof json !== 'string' || !json.trim()) return [];
  try {
    return normalizeBuyerQuestionDefs(JSON.parse(json));
  } catch {
    return [];
  }
}

export type BuyerQuestionDefsByLine = Record<string, BuyerQuestionDef[]>;

export function getCartLineBuyerQuestions(
  metadata: Record<string, unknown> | undefined,
  lineId?: string,
  defsByLine?: BuyerQuestionDefsByLine,
): BuyerQuestionDef[] {
  if (!metadata) {
    if (lineId && defsByLine?.[lineId]?.length) return defsByLine[lineId];
    return [];
  }
  const fromJson = parseBuyerQuestionsJson(metadata.buyerQuestionsJson);
  if (fromJson.length > 0) return fromJson;
  if (lineId && defsByLine?.[lineId]?.length) return defsByLine[lineId];
  return [];
}

export function cartLineNeedsBuyerQuestions(
  metadata: Record<string, unknown> | undefined,
  lineId?: string,
  defsByLine?: BuyerQuestionDefsByLine,
): boolean {
  return getCartLineBuyerQuestions(metadata, lineId, defsByLine).length > 0;
}

export function parseIncomingBuyerAnswerSets(item: {
  buyerAnswerSets?: unknown;
  metadata?: Record<string, unknown>;
}): BuyerAnswerSet[] | undefined {
  const direct = item.buyerAnswerSets;
  if (Array.isArray(direct)) return direct as BuyerAnswerSet[];
  const meta = item.metadata?.buyerAnswerSets;
  if (Array.isArray(meta)) return meta as BuyerAnswerSet[];
  if (typeof meta === 'string' && meta.trim()) {
    try {
      const parsed = JSON.parse(meta);
      if (Array.isArray(parsed)) return parsed as BuyerAnswerSet[];
    } catch {
      // ignore
    }
  }
  return undefined;
}

export function validateBuyerAnswerSetsForTier(
  questions: BuyerQuestionDef[],
  quantity: number,
  answerSets: BuyerAnswerSet[] | undefined,
): BuyerAnswerSet[] {
  if (questions.length === 0) {
    if (answerSets?.length) {
      throw new Error('Unexpected buyer answers for this ticket tier');
    }
    return [];
  }

  if (!Array.isArray(answerSets) || answerSets.length !== quantity) {
    throw new Error(
      `Please complete all ticket details (${quantity} required for this tier)`,
    );
  }

  const normalized: BuyerAnswerSet[] = [];

  for (let unit = 0; unit < quantity; unit++) {
    const set = answerSets[unit];
    if (!Array.isArray(set)) {
      throw new Error('Invalid ticket detail answers');
    }
    const byKey = new Map<string, string>();
    for (const entry of set) {
      if (!entry || typeof entry !== 'object') continue;
      const key = typeof entry.key === 'string' ? entry.key.trim() : '';
      const value = typeof entry.value === 'string' ? entry.value.trim() : '';
      if (key) byKey.set(key, value.slice(0, 2000));
    }

    const unitAnswers: BuyerAnswerEntry[] = [];
    for (const q of questions) {
      const value = byKey.get(q.key) || '';
      if (q.required && !value) {
        throw new Error(`"${q.label}" is required (ticket ${unit + 1})`);
      }
      if (q.type === 'select' && value) {
        const allowed = (q.options || []).map((o) => o.value);
        if (!allowed.includes(value)) {
          throw new Error(
            `Invalid choice for "${q.label}" (ticket ${unit + 1})`,
          );
        }
      }
      if (value) {
        unitAnswers.push({ key: q.key, label: q.label, value });
      } else if (!q.required) {
        unitAnswers.push({ key: q.key, label: q.label, value: '' });
      }
    }
    normalized.push(unitAnswers);
  }

  return normalized;
}

export function formatPayloadAnswerSetsForDisplay(
  answerSets:
    | {
        answers?:
          | { key: string; label: string; value?: string | null }[]
          | null;
      }[]
    | undefined
    | null,
): string {
  if (!answerSets?.length) return '';
  const normalized: BuyerAnswerSet[] = answerSets.map((s) =>
    (s.answers || []).map((a) => ({
      key: a.key,
      label: a.label,
      value: typeof a.value === 'string' ? a.value : '',
    })),
  );
  return formatBuyerAnswerSetsForDisplay(normalized);
}

export function formatBuyerAnswerSetsForDisplay(
  answerSets: BuyerAnswerSet[] | undefined | null,
): string {
  if (!answerSets?.length) return '';
  return answerSets
    .map((set, i) => {
      const lines = (set || [])
        .filter((a) => a.value?.trim())
        .map((a) => `${a.label}: ${a.value}`)
        .join('; ');
      return lines ? `#${i + 1}: ${lines}` : '';
    })
    .filter(Boolean)
    .join(' | ');
}
