'use client';

import React, { useState } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { useShipping } from '../../_providers/ShippingProvider';
import { calculateTotalWithVAT } from '../../_types/shipping';
import Button from '../Button';
import type { Merch, Release } from '../../../payload/payload-types';

interface AddToCartButtonProps {
  item: Merch | Release;
  type: 'merch' | 'release';
  selectedVariant?: string; // For clothing sizes only
  disabled?: boolean;
}

// Type guards
const hasPrice = (
  item: Merch | Release
): item is (Merch | Release) & { price: number } => {
  return 'price' in item && typeof item.price === 'number' && item.price > 0;
};

const hasStockQuantity = (
  item: Merch | Release
): item is (Merch | Release) & { stockQuantity: number } => {
  return 'stockQuantity' in item && typeof item.stockQuantity === 'number';
};

const AddToCartButton: React.FC<AddToCartButtonProps> = ({
  item,
  type,
  selectedVariant,
  disabled,
}) => {
  const { addItem } = useShoppingCart();
  const { selectedRegion, getVATRate } = useShipping();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    // Type guard to ensure item has required properties
    if (!hasPrice(item)) return;

    setIsAdding(true);

    try {
      const basePrice = item.price;

      // Get image URL safely
      const getImageUrl = () => {
        if (type === 'release') {
          const release = item as Release;
          return typeof release.artwork === 'string'
            ? release.artwork
            : release.artwork?.url || '';
        } else {
          const merch = item as Merch;
          return typeof merch.mainImage === 'string'
            ? merch.mainImage
            : merch.mainImage?.url || '';
        }
      };

      // Create cart item WITHOUT VAT (will be calculated at cart level)
      const cartItem = {
        id: `${type}_${item.id}_${selectedRegion}${selectedVariant ? `_${selectedVariant}` : ''}`, // Include variant in ID
        name: item.title,
        description:
          type === 'release'
            ? `${(item as Release).catalogNumber} - ${(item as Release).releaseYear}`
            : (item as Merch).itemType,
        price: Math.round(basePrice * 100), // Convert to cents, NO VAT added here
        currency: 'EUR',
        image: getImageUrl(),
        product_data: {
          metadata: {
            type,
            itemId: item.id,
            shippingRegion: selectedRegion,
            basePrice: basePrice.toString(),
            variant: selectedVariant || '', // For clothing sizes only
            isDigital: ('isDigital' in item
              ? item.isDigital
              : false
            ).toString(),
            // Store shipping prices for cart-level calculation
            shippingPrices: JSON.stringify(
              'shippingPrices' in item ? item.shippingPrices : {}
            ),
          },
        },
      };

      await addItem(cartItem);
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

  // Check availability
  const itemHasPrice = hasPrice(item);
  const isOutOfStock = hasStockQuantity(item) && item.stockQuantity <= 0;

  if (!itemHasPrice) {
    return <Button label='Not Available' disabled />;
  }

  if (isOutOfStock) {
    return <Button label='Out of Stock' disabled />;
  }

  return (
    <Button
      onClick={handleAddToCart}
      label={isAdding ? 'Adding...' : 'Add to Cart'}
      disabled={isAdding || disabled}
    />
  );
};

export default AddToCartButton;
