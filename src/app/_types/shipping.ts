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
    type: string; // 'release' or 'merch'
    itemType?: string; // For merch: 'clothing', 'prints', 'other'
  }>,
  region: ShippingRegion
): number => {
  // Filter out digital items as they don't require shipping
  const physicalItems = cartItems.filter((item) => !item.isDigital);

  if (physicalItems.length === 0) return 0;

  // Categorize items based on shipping combination rules
  const vinyl: typeof physicalItems = [];
  const shirts: typeof physicalItems = [];
  const prints: typeof physicalItems = [];
  const other: typeof physicalItems = [];

  physicalItems.forEach((item) => {
    if (item.type === 'release') {
      vinyl.push(item);
    } else if (item.type === 'merch') {
      if (item.itemType === 'clothing') {
        shirts.push(item);
      } else if (item.itemType === 'prints') {
        prints.push(item);
      } else {
        other.push(item);
      }
    } else {
      other.push(item);
    }
  });

  let totalShippingCost = 0;

  // Helper function to calculate shipping for a group using higher shipping price logic
  const calculateGroupShippingWithHigherPrice = (
    items: typeof physicalItems
  ): number => {
    if (items.length === 0) return 0;

    // Find the highest shipping price structure among all items
    let highestFirstPrice = 0;
    let highestAdditionalPrice = 0;
    let highestShippingStructure: ShippingPrices | null = null;

    items.forEach((item) => {
      const firstPrice = item.shippingPrices[region] || 0;
      const additionalPrice =
        item.shippingPrices[`${region}Additional` as keyof ShippingPrices] || 0;

      if (firstPrice > highestFirstPrice) {
        highestFirstPrice = firstPrice;
        highestAdditionalPrice = additionalPrice;
        highestShippingStructure = item.shippingPrices;
      }
    });

    if (!highestShippingStructure) return 0;

    // Calculate total quantity
    const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

    // Apply the highest shipping price structure to the total quantity
    if (totalQuantity === 1) {
      return highestFirstPrice;
    } else {
      return highestFirstPrice + highestAdditionalPrice * (totalQuantity - 1);
    }
  };

  // Helper function to calculate shipping for a group by adding each item's shipping
  const calculateGroupShippingAdditive = (
    items: typeof physicalItems
  ): number => {
    return items.reduce((total, item) => {
      const firstPrice = item.shippingPrices[region] || 0;
      const additionalPrice =
        item.shippingPrices[`${region}Additional` as keyof ShippingPrices] || 0;

      if (item.quantity === 1) {
        return total + firstPrice;
      } else {
        return total + firstPrice + additionalPrice * (item.quantity - 1);
      }
    }, 0);
  };

  // Apply combination rules:

  // 1. Vinyl and shirts can be combined (use higher shipping price)
  if (vinyl.length > 0 && shirts.length > 0) {
    const combinedVinylShirts = [...vinyl, ...shirts];
    totalShippingCost +=
      calculateGroupShippingWithHigherPrice(combinedVinylShirts);
  } else {
    // Handle separately if only one type
    if (vinyl.length > 0) {
      totalShippingCost += calculateGroupShippingWithHigherPrice(vinyl);
    }
    if (shirts.length > 0) {
      totalShippingCost += calculateGroupShippingWithHigherPrice(shirts);
    }
  }

  // 2. Prints and shirts can be combined (use higher shipping price)
  // But only if shirts haven't been combined with vinyl already
  if (prints.length > 0) {
    if (vinyl.length === 0 && shirts.length > 0) {
      // Combine prints with shirts (vinyl not present)
      const combinedPrintsShirts = [...prints, ...shirts];
      // Subtract the shirts shipping we already counted
      totalShippingCost -= calculateGroupShippingWithHigherPrice(shirts);
      totalShippingCost +=
        calculateGroupShippingWithHigherPrice(combinedPrintsShirts);
    } else {
      // 3. Prints and vinyl cannot be combined, add their shipping prices
      totalShippingCost += calculateGroupShippingAdditive(prints);
    }
  }

  // Handle other items separately
  if (other.length > 0) {
    totalShippingCost += calculateGroupShippingAdditive(other);
  }

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
