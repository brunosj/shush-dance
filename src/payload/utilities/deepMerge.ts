/**
 * Simple object check.
 */
export function isObject(item: unknown): item is Record<string, unknown> {
  return Boolean(item) && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Deep merge two objects.
 */
export default function deepMerge<T extends object, R extends object>(
  target: T,
  source: R,
): T {
  const output: Record<string, unknown> = { ...(target as object) };

  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      const sourceValue = source[key];
      if (isObject(sourceValue)) {
        if (!(key in target)) {
          Object.assign(output, { [key]: sourceValue });
        } else {
          output[key] = deepMerge(
            (target as Record<string, unknown>)[key] as object,
            sourceValue,
          );
        }
      } else {
        Object.assign(output, { [key]: sourceValue });
      }
    });
  }

  return output as T;
}
