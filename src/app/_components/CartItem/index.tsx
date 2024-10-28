// CartItem.tsx
import { useState } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { formatCurrencyString } from 'use-shopping-cart';
import Image from 'next/image';

type Props = {
  item: {
    id: string;
    quantity: number;
    ticketTier: any; // Assuming you pass the ticket tier directly
  };
};

const CartItem = ({ item }: Props) => {
  const { id, quantity } = item;
  const { tierName, stripePriceId, price } = item.ticketTier; // Destructure from ticketTier

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

  return (
    <div className='flex flex-col lg:flex-row items-center mb-3 p-2 justify-between rounded-md'>
      <div className='flex items-center gap-4 w-full lg:w-auto'>
        <div className='relative h-20 aspect-square'>
          <Image
            src='/path/to/default/image.jpg' // Replace with a default image or handle dynamically
            alt={tierName}
            className='object-contain'
            fill
            priority
          />
        </div>
        <div>
          {tierName} <span className='text-xs'>({itemQuantity})</span>
        </div>
      </div>
      <div className='flex items-center justify-around w-full lg:w-auto gap-6'>
        <div>
          {formatCurrencyString({
            value: parseFloat(price) * 100 * itemQuantity, // Convert price string to number
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
          {/* <BsTrash3 className='w-4 h-4' /> */}
        </button>
      </div>
    </div>
  );
};

export default CartItem;
