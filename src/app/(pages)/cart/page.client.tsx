'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { BsTrash3 } from 'react-icons/bs';
import Link from 'next/link';
import Button from '../../_components/Button';
import type { Page } from '../../../payload/payload-types';
import { RichText } from '../../_components/RichText';

interface CartPageProps {
  data: {
    page: Page | null | undefined;
  };
}

const CartPageTemplate: React.FC<CartPageProps> = ({ data }) => {
  const { page } = data;
  const {
    cartCount,
    cartDetails,
    formattedTotalPrice,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    redirectToCheckout,
  } = useShoppingCart();

  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (cartCount !== undefined) {
      setIsLoading(false);
    }
  }, [cartCount]);

  const handleCheckout = async () => {
    try {
      const result = await redirectToCheckout();
      if (result?.error) {
        console.error('Error during checkout:', result.error);
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  if (!page) {
    return <p>Loading...</p>;
  }

  if (isLoading) {
    return (
      <p className='text-center mt-32 text-base lg:text-xl'>
        Loading your cart...
      </p>
    );
  }

  if (cartCount === 0) {
    return (
      <div className='text-center mt-32 space-y-4 lg:space-y-6'>
        <h1 className='text-base lg:text-xl'>Your cart is empty</h1>
        <div>
          <Button href='/' label='Return to home' />
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-lg mx-2 lg:mx-auto mt-32'>
      <ul className='space-y-4'>
        {Object.entries(cartDetails).map(([key, item]) => (
          <li
            key={key}
            className='flex justify-between items-center border-b pb-2 '
          >
            <div className='flex flex-col'>
              <p className='font-bold '>{item.name}</p>
              <p className='opacity-60'>Price: {item.formattedValue}</p>
              <p className='opacity-60'>Quantity: {item.quantity}</p>
            </div>
            <div className='flex items-center gap-2'>
              <button
                onClick={() => decrementItem(key)}
                className='bg-gray-200 text-black px-2 py-1 rounded'
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button
                onClick={() => incrementItem(key)}
                className='bg-gray-200 text-black px-2 py-1 rounded'
              >
                +
              </button>
              <button
                className='text-black px-2 py-1 rounded'
                onClick={() => removeItem(key)}
              >
                <BsTrash3 className='w-4 h-4' />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className='mt-4'>
        <h2 className='text-lg lg:text-xl font-semibold'>
          Total: {formattedTotalPrice}
        </h2>
      </div>
      <div className='mt-6 space-x-3'>
        <Button label='Checkout' onClick={handleCheckout} />
      </div>
      <div className='my-12 lg:my-24'>
        <RichText content={page.content} className='text-xs lg:text-sm' />
      </div>
    </div>
  );
};

export default CartPageTemplate;
