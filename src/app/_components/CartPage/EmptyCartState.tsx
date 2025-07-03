import React from 'react';

const EmptyCartState: React.FC = () => {
  return (
    <div className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-3'>
      <h2 className='text-2xl font-bold'>Your cart is empty</h2>
      <p className='text-gray-600'>
        Check out our releases and merch to add some items to your cart.
      </p>
    </div>
  );
};

export default EmptyCartState;
