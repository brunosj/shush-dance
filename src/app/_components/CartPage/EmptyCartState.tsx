import React from 'react';

const EmptyCartState: React.FC = () => {
  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12 text-center'>
      <h2 className='text-2xl font-bold mb-4'>Your cart is empty</h2>
      <p className='text-gray-600'>
        Add some items to your cart to see them here.
      </p>
    </div>
  );
};

export default EmptyCartState;
