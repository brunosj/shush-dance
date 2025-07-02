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
  // Filter out digital items as they don't require shipping
  const physicalItems = cartItems.filter((item) => !item.isDigital);

  if (physicalItems.length === 0) return 0;

  // Group items by their shipping price structure
  const shippingGroups = new Map<
    string,
    { items: typeof physicalItems; totalQuantity: number }
  >();

  physicalItems.forEach((item) => {
    // Create a unique key based on shipping prices for this region
    const firstPrice = item.shippingPrices[region] || 0;
    const additionalPrice =
      item.shippingPrices[`${region}Additional` as keyof ShippingPrices] || 0;
    const shippingKey = `${firstPrice}-${additionalPrice}`;

    if (!shippingGroups.has(shippingKey)) {
      shippingGroups.set(shippingKey, { items: [], totalQuantity: 0 });
    }

    const group = shippingGroups.get(shippingKey)!;
    group.items.push(item);
    group.totalQuantity += item.quantity;
  });

  // Calculate shipping cost for each group and sum them up
  let totalShippingCost = 0;

  shippingGroups.forEach((group) => {
    // Use the first item's shipping structure for this group (they're all the same)
    const shippingStructure = group.items[0].shippingPrices;
    const firstUnitPrice = shippingStructure[region] || 0;
    const additionalUnitPrice =
      shippingStructure[`${region}Additional` as keyof ShippingPrices] || 0;

    // Calculate shipping for this group: first unit + (total quantity - 1) * additional unit price
    if (group.totalQuantity === 1) {
      totalShippingCost += firstUnitPrice;
    } else {
      totalShippingCost +=
        firstUnitPrice + additionalUnitPrice * (group.totalQuantity - 1);
    }
  });

  return totalShippingCost;
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
