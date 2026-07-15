export const TSHIRT_SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL'] as const;

export function isValidTshirtSize(value: string): boolean {
  return (TSHIRT_SIZES as readonly string[]).includes(value);
}
