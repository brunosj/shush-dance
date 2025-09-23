import React from 'react';
import { formatCurrencyString } from 'use-shopping-cart';

interface ReviewOrderItemsProps {
  cartDetails: any;
  className?: string;
}

const ReviewOrderItems: React.FC<ReviewOrderItemsProps> = ({
  cartDetails,
  className = '',
}) => {
  return (
    <div className={`bg-gray-50 p-6 rounded-lg ${className}`}>
      <h4 className='font-semibold mb-4'>Order Items</h4>
      <ul className='space-y-3'>
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
              className='flex justify-between items-start border-b border-gray-200 pb-3 last:border-b-0 last:pb-0'
            >
              <div className='flex-1'>
                <h5 className='font-medium text-sm'>
                  {item?.name || 'Product'}
                </h5>
                <p className='text-gray-600 text-xs mt-1'>
                  <span className='capitalize'>
                    {item?.description || 'Unknown'}
                  </span>
                  {variant &&
                    ` | ${metadata.type === 'merch' ? 'Size' : 'Format'}: ${variant}`}
                </p>
                <p className='text-gray-600 text-xs mt-1'>
                  {formatCurrencyString({
                    value: Math.round(unitPrice * 100),
                    currency: 'EUR',
                  })}{' '}
                  × {item?.quantity}
                </p>
              </div>
              <div className='text-right'>
                <p className='font-medium text-sm'>
                  {formatCurrencyString({
                    value: Math.round(totalPrice * 100),
                    currency: 'EUR',
                  })}
                </p>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ReviewOrderItems;
