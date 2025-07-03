import React from 'react';
import { BsTrash3 } from 'react-icons/bs';
import { formatCurrencyString } from 'use-shopping-cart';

interface CartItemsListProps {
  cartDetails: any;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  removeItem: (id: string) => void;
}

const CartItemsList: React.FC<CartItemsListProps> = ({
  cartDetails,
  incrementItem,
  decrementItem,
  removeItem,
}) => {
  return (
    <ul className='space-y-4 pt-6'>
      {Object.entries(cartDetails || {}).map(([key, item]: [string, any]) => {
        // Extract metadata from product_data
        const productData = item?.product_data as any;
        const metadata = productData?.metadata || {};
        const variant = metadata.variant;

        // Calculate proper price display
        const unitPrice = item?.price ? item.price / 100 : 0;
        const totalPrice = unitPrice * (item?.quantity || 1);

        return (
          <li
            key={key}
            className='flex justify-between flex-col border-b pb-3 lg:pb-6 space-y-2 border-gray'
          >
            <div className='flex flex-col'>
              <h4 className='font-bold '>{item?.name || 'Product'}</h4>
              <p className='text-darkGray'>
                <span className='capitalize'>
                  {item?.description || 'Unknown'}
                </span>
                {variant &&
                  ` | ${metadata.type === 'merch' ? 'Size' : 'Format'}: ${variant}`}{' '}
                |{' '}
                {formatCurrencyString({
                  value: Math.round(unitPrice * 100), // Convert back to cents for formatting
                  currency: 'EUR',
                })}{' '}
                per item
              </p>
            </div>
            <div className='ml-auto flex items-center gap-2 space-x-3'>
              <button
                onClick={() => decrementItem(key)}
                className='bg-gray-50 text-black px-2 py-1'
                disabled={item?.quantity <= 1}
              >
                -
              </button>
              <span className='text-sm lg:text-base'>{item?.quantity}</span>
              <button
                onClick={() => incrementItem(key)}
                className='bg-gray-50 text-black px-2 py-1'
              >
                +
              </button>
              <div className='h-6 border-l border-gray'></div>
              <p>
                {formatCurrencyString({
                  value: Math.round(totalPrice * 100), // Convert to cents for formatting
                  currency: 'EUR',
                })}
              </p>
              <div className='h-6 border-l border-gray'></div>
              <button
                className='text-black px-2 py-1 rounded'
                onClick={() => removeItem(key)}
              >
                <BsTrash3 className='w-4 h-4' />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
};

export default CartItemsList;
