/**
 * Preview URL secret shared by Payload admin preview links and `/next/preview`.
 * Prefer `NEXT_PRIVATE_DRAFT_SECRET`; `PAYLOAD_PUBLIC_DRAFT_SECRET` is legacy.
 */
export function getDraftPreviewSecret(): string {
  return (
    process.env.NEXT_PRIVATE_DRAFT_SECRET?.trim() ||
    process.env.PAYLOAD_PUBLIC_DRAFT_SECRET?.trim() ||
    ''
  );
}