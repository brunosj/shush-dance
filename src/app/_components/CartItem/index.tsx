// CartItem.tsx
import { useState } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { formatCurrencyString } from 'use-shopping-cart';
import Image from 'next/image';

type Props = {
  item: {
    id: string;
    name?: string;
    description?: string;
    price?: number;
    quantity: number;
    image?: string;
    product_data?: {
      metadata?: {
        variant?: string;
        type?: string;
        itemId?: string;
      };
    };
  };
};

const CartItem = ({ item }: Props) => {
  const { id, quantity, name, description, price, image, product_data } = item;
  const metadata = product_data?.metadata || {};
  const variant = metadata.variant;

  const { incrementItem, decrementItem, removeItem } = useShoppingCart();
  const [itemQuantity, setItemQuantity] = useState(quantity);

  const removeItemFromCart = () => {
    removeItem(id);
  };

  const handleIncrement = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    incrementItem(id);
    setItemQuantity((prev) => prev + 1);
  };

  const handleDecrement = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (itemQuantity > 1) {
      event.preventDefault();
      event.stopPropagation();
      decrementItem(id);
      setItemQuantity((prev) => prev - 1);
    }
  };

  // Calculate prices
  const unitPrice = price ? price / 100 : 0; // Convert from cents
  const totalPrice = unitPrice * itemQuantity;

  return (
    <div className='flex flex-col lg:flex-row items-center mb-3 p-2 justify-between rounded-md'>
      <div className='flex items-center gap-4 w-full lg:w-auto'>
        <div className='relative h-20 aspect-square'>
          <Image
            src={image || '/path/to/default/image.jpg'} // Use provided image or default
            alt={name || 'Product'}
            className='object-contain'
            fill
            priority
          />
        </div>
        <div>
          <div className='font-semibold'>{name || 'Product'}</div>
          <div className='text-sm text-gray-600'>
            {description}
            {variant &&
              ` | ${metadata.type === 'merch' ? 'Size' : 'Format'}: ${variant}`}
          </div>
          <span className='text-xs'>({itemQuantity})</span>
        </div>
      </div>
      <div className='flex items-center justify-around w-full lg:w-auto gap-6'>
        <div>
          {formatCurrencyString({
            value: Math.round(totalPrice * 100), // Convert to cents for formatting
            currency: 'EUR',
          })}
        </div>
        <div className='flex items-center gap-2'>
          <button onClick={handleDecrement} className='p-1'>
            -
          </button>
          <span>{itemQuantity}</span>
          <button onClick={handleIncrement} className='p-1'>
            +
          </button>
        </div>
        <button
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            removeItemFromCart();
          }}
          className='p-1'
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default CartItem;
