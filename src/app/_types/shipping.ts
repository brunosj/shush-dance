export type ShippingRegion = 'germany' | 'eu' | 'restOfWorld';

export interface ShippingPrices {
  germany: number;
  germanyAdditional: number;
  eu: number;
  euAdditional: number;
  restOfWorld: number;
  restOfWorldAdditional: number;
}

export interface ShippingLocation {
  region: ShippingRegion;
  label: string;
  vatRate: number; // VAT rate for the region (Germany: 0.19, others: 0)
}

export const SHIPPING_LOCATIONS: ShippingLocation[] = [
  { region: 'germany', label: 'Germany', vatRate: 0.19 },
  { region: 'eu', label: 'European Union', vatRate: 0 },
  { region: 'restOfWorld', label: 'Rest of World', vatRate: 0 },
];

export const getShippingPrice = (
  shippingPrices: ShippingPrices,
  region: ShippingRegion,
  quantity: number = 1
): number => {
  if (quantity <= 0) return 0;

  const firstItemPrice = shippingPrices[region] || 0;
  const additionalItemPrice =
    shippingPrices[`${region}Additional` as keyof ShippingPrices] || 0;

  if (quantity === 1) {
    return firstItemPrice;
  }

  return firstItemPrice + additionalItemPrice * (quantity - 1);
};

export const calculateCartShipping = (
  cartItems: Array<{
    shippingPrices: ShippingPrices;
    quantity: number;
    isDigital: boolean;
  }>,
  region: ShippingRegion
): number => {
  let totalShipping = 0;
  let hasPhysicalItems = false;

  // Group items by shipping type and calculate total quantity of physical items
  const physicalItems = cartItems.filter((item) => !item.isDigital);

  if (physicalItems.length === 0) return 0;

  // For simplicity, we'll use the highest shipping rate for the first item
  // and add additional shipping for each extra item
  let totalQuantity = 0;
  let maxFirstItemShipping = 0;
  let maxAdditionalShipping = 0;

  physicalItems.forEach((item) => {
    totalQuantity += item.quantity;
    const firstItemShipping = item.shippingPrices[region] || 0;
    const additionalShipping =
      item.shippingPrices[`${region}Additional` as keyof ShippingPrices] || 0;

    maxFirstItemShipping = Math.max(maxFirstItemShipping, firstItemShipping);
    maxAdditionalShipping = Math.max(maxAdditionalShipping, additionalShipping);
  });

  if (totalQuantity === 1) {
    return maxFirstItemShipping;
  }

  return maxFirstItemShipping + maxAdditionalShipping * (totalQuantity - 1);
};

export const calculateVAT = (price: number, vatRate: number): number => {
  return Math.round(price * vatRate * 100) / 100;
};

export const calculateTotalWithVAT = (
  price: number,
  vatRate: number
): number => {
  return price + calculateVAT(price, vatRate);
};
