'use client';

import React, { useState } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { useShipping } from '../../_providers/ShippingProvider';
import Button from '../Button';
import type { Merch, Release } from '../../../payload/payload-types';
import toast from 'react-hot-toast';
import {
  resolveMediaResource,
  resolveMediaUrl,
} from '../../_utilities/getMediaUrl';
import {
  canAddCurrencyToCart,
  DEFAULT_CURRENCY,
} from '../../../utilities/currency';

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
  const { addItem, cartDetails } = useShoppingCart();
  const { selectedRegion } = useShipping();
  const [isAdding, setIsAdding] = useState(false);

  const handleAddToCart = async () => {
    if (!hasPrice(item)) return;

    const allowed = canAddCurrencyToCart(cartDetails, DEFAULT_CURRENCY);
    if (allowed.ok === false) {
      toast.error(
        `Your cart is in ${allowed.cartCurrency}. Empty it (or remove other-currency items) before adding EUR shop items.`
      );
      return;
    }

    setIsAdding(true);

    try {
      const basePrice = item.price;

      const getImageUrl = () => {
        if (type === 'release') {
          const release = item as Release;
          return typeof release.artwork === 'string'
            ? resolveMediaUrl(release.artwork)
            : resolveMediaResource(release.artwork) || '';
        }

        const merch = item as Merch;
        return typeof merch.mainImage === 'string'
          ? resolveMediaUrl(merch.mainImage)
          : resolveMediaResource(merch.mainImage) || '';
      };

      const cartItem = {
        id: `${type}_${item.id}_${selectedRegion}${selectedVariant ? `_${selectedVariant}` : ''}`,
        name: item.title,
        description:
          type === 'release'
            ? `${(item as Release).catalogNumber} - ${(item as Release).releaseYear}`
            : (item as Merch).itemType,
        price: Math.round(basePrice * 100),
        currency: DEFAULT_CURRENCY,
        image: getImageUrl(),
        product_data: {
          metadata: {
            type,
            itemId: item.id,
            shippingRegion: selectedRegion,
            basePrice: basePrice.toString(),
            variant: selectedVariant || '',
            isDigital: ('isDigital' in item
              ? item.isDigital
              : false
            ).toString(),
            currency: DEFAULT_CURRENCY,
            itemType: type === 'merch' ? (item as Merch).itemType : 'vinyl',
            shippingPrices: JSON.stringify(
              'shippingPrices' in item ? item.shippingPrices : {}
            ),
          },
        },
      };

      await addItem(cartItem);
      toast.success('Added to cart!');
    } catch (error) {
      console.error('Failed to add item to cart:', error);
    } finally {
      setIsAdding(false);
    }
  };

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
