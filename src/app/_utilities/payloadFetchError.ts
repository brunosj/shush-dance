export class PayloadFetchError extends Error {
  readonly status: number;
  readonly slug?: string;
  readonly context?: string;

  constructor(
    message: string,
    options: { status: number; slug?: string; context?: string }
  ) {
    super(message);
    this.name = 'PayloadFetchError';
    this.status = options.status;
    this.slug = options.slug;
    this.context = options.context;
  }
}

export function isPayloadFetchError(
  error: unknown
): error is PayloadFetchError {
  return error instanceof PayloadFetchError;
}
