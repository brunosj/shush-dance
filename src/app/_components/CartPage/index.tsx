'use client';

import React from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { formatCurrencyString } from 'use-shopping-cart';
import { BsTrash3 } from 'react-icons/bs';
import Link from 'next/link';
const Cart: React.FC = () => {
  const {
    cartCount,
    cartDetails,
    formattedTotalPrice,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    redirectToCheckout,
  } = useShoppingCart(); // Access cart state and functions

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

  if (cartCount === 0) {
    return (
      <div className='text-center mt-32 space-y-4'>
        <h1 className='text-2xl font-semibold'>Your Cart is Empty</h1>
        <Link href='/' className='pt-4'>
          back to homepage
        </Link>
      </div>
    );
  }

  return (
    <div className='max-w-lg mx-2 lg:mx-auto mt-32'>
      {/* <h1 className='text-2xl font-semibold mb-4'>Your Cart</h1> */}
      <ul className='space-y-4'>
        {Object.entries(cartDetails).map(([key, item]) => (
          <li
            key={key}
            className='flex justify-between items-center border-b pb-2'
          >
            <div className='flex flex-col'>
              <p className='font-bold text-lg'>{item.name}</p>
              <p className='text-gray-500'>Price: {item.formattedValue}</p>
              <p className='text-gray-500'>Quantity: {item.quantity}</p>
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
        <h2 className='text-xl font-semibold'>Total: {formattedTotalPrice}</h2>
      </div>
      <div className='mt-6'>
        <button
          className='bg-black text-white px-4 py-2 rounded mr-2'
          onClick={clearCart}
        >
          Clear Cart
        </button>
        <button
          className='bg-black text-white px-4 py-2 rounded'
          onClick={handleCheckout}
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;
