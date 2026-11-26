/**
 * next/cache only works inside the Next runtime. Payload CLI
 * (`generate:types`, `payload run`) loads collection hooks — fail soft.
 */
export function safeRevalidateTag(tag: string): void {
  void import('next/cache')
    .then(({ revalidateTag }) => {
      revalidateTag(tag, 'max');
    })
    .catch(() => {
      // not in a Next request / build worker
    });
}

export function safeRevalidatePath(
  path: string,
  type?: 'page' | 'layout',
): void {
  void import('next/cache')
    .then(({ revalidatePath }) => {
      if (type) {
        revalidatePath(path, type);
      } else {
        revalidatePath(path);
      }
    })
    .catch(() => {
      // not in a Next request / build worker
    });
}