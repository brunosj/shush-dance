'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { formatCurrencyString } from 'use-shopping-cart';
import { BsTrash3 } from 'react-icons/bs';
import Link from 'next/link';
import Button from '../../Button';
import type { Page } from '../../../../payload/payload-types';
import { RichText } from '../../RichText';

interface CartPageProps {
  data: {
    page: { data: Page | null | undefined };
  };
}

const Cart: React.FC<CartPageProps> = ({ data }) => {
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
      <div className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
        <h1 className='text-base lg:text-xl'>Your cart is empty</h1>
        <div>
          <Button href='/' label='Return to Home' />
        </div>
      </div>
    );
  }

  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-32'>
      <ul className='space-y-4'>
        {Object.entries(cartDetails).map(([key, item]) => (
          <li
            key={key}
            className='flex justify-between flex-col  border-b pb-3 lg:pb-6  space-y-2 border-gray'
          >
            <div className='flex flex-col'>
              <h4 className='font-bold '>{item.parentItem}</h4>
              <p className='text-darkGray'>
                {item.name} | {formatCurrencyString(item.priceObject)}
              </p>
              <p className='text-darkGray'></p>
              {/* <p className='text-gray'>Quantity: {item.quantity}</p> */}
            </div>

            <div className='ml-auto flex items-center gap-2 space-x-3'>
              <button
                onClick={() => decrementItem(key)}
                className='bg-white border border-gray-300 text-black px-2 py-1'
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span className='text-sm lg:text-base'>{item.quantity}</span>
              <button
                onClick={() => incrementItem(key)}
                className='bg-white border border-gray-300 text-black px-2 py-1'
              >
                +
              </button>
              <div className='h-6 border-l border-gray '></div>

              <p>{item.formattedValue}</p>
              <div className='h-6 border-l border-gray '></div>

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
      <div className='mt-6 flex flex-col space-y-6'>
        <div className='ml-auto'>
          <h3 className='font-semibold'>Total: {formattedTotalPrice}</h3>
        </div>
        <div className='ml-auto  '>
          <Button label='Checkout' onClick={handleCheckout} />
        </div>
      </div>
      <div className='mt-12 mb-24 lg:mt-24 lg:mb-32'>
        <RichText content={page.data.content} className='richTextSmallP' />
      </div>
    </div>
  );
};

export default Cart;
