import React from 'react';
import { formatCurrencyString } from 'use-shopping-cart';

interface OrderSummaryProps {
  subtotalExclVAT: number;
  shippingCost: number;
  totalVAT: number;
  finalTotal: number;
  regionLabel: string;
  selectedRegion: string;
  onProceedToCheckout?: () => void;
  showProceedButton?: boolean;
  title?: string;
  className?: string;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotalExclVAT,
  shippingCost,
  totalVAT,
  finalTotal,
  regionLabel,
  selectedRegion,
  onProceedToCheckout,
  showProceedButton = false,
  title = 'Order Summary',
  className = '',
}) => {
  return (
    <div className={`bg-gray-50 p-6 rounded-lg ${className}`}>
      <h4 className='font-semibold mb-4'>{title}</h4>
      <div className='space-y-2 text-sm lg:text-base'>
        <div className='flex justify-between'>
          <span>Subtotal (excl. VAT):</span>
          <span>
            {formatCurrencyString({
              value: subtotalExclVAT,
              currency: 'EUR',
            })}
          </span>
        </div>
        <div className='flex justify-between'>
          <span>Shipping ({regionLabel}):</span>
          <span>
            {formatCurrencyString({
              value: shippingCost,
              currency: 'EUR',
            })}
          </span>
        </div>
        <div className='flex justify-between'>
          <span>VAT ({selectedRegion === 'germany' ? '19%' : '0%'}):</span>
          <span>
            {formatCurrencyString({ value: totalVAT, currency: 'EUR' })}
          </span>
        </div>
        <hr className='my-2' />
        <div className='flex justify-between font-semibold text-sm lg:text-lg'>
          <span>Total:</span>
          <span>
            {formatCurrencyString({
              value: finalTotal,
              currency: 'EUR',
            })}
          </span>
        </div>
      </div>

      {showProceedButton && onProceedToCheckout && (
        <button
          onClick={onProceedToCheckout}
          className='w-full mt-6 bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm'
        >
          Proceed to Checkout
        </button>
      )}
    </div>
  );
};

export default OrderSummary;
