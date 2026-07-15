import React from 'react';
import { formatCurrencyString } from 'use-shopping-cart';

interface OrderSummaryProps {
  subtotalExclVAT: number;
  shippingCost: number;
  totalVAT: number;
  ticketVatCents?: number;
  merchVatCents?: number;
  finalTotal: number;
  regionLabel: string;
  selectedRegion: string;
  onProceedToCheckout?: () => void;
  showProceedButton?: boolean;
  title?: string;
  className?: string;
  isTicketOnlyCart?: boolean;
  hasTickets?: boolean;
}

const OrderSummary: React.FC<OrderSummaryProps> = ({
  subtotalExclVAT,
  shippingCost,
  totalVAT,
  ticketVatCents = 0,
  merchVatCents = 0,
  finalTotal,
  regionLabel,
  selectedRegion,
  onProceedToCheckout,
  showProceedButton = false,
  title = 'Order Summary',
  className = '',
  isTicketOnlyCart = false,
  hasTickets = false,
}) => {
  const merchVatRateLabel =
    selectedRegion === 'germany' ? '19%' : '0%';

  return (
    <div className={`bg-gray-50 p-6 rounded-lg ${className}`}>
      <h4 className='font-semibold mb-4'>{title}</h4>
      <div className='space-y-2 text-sm lg:text-base'>
        <div className='flex justify-between'>
          <span>
            {isTicketOnlyCart ? 'Subtotal:' : 'Subtotal (incl. tickets):'}
          </span>
          <span>
            {formatCurrencyString({
              value: subtotalExclVAT,
              currency: 'EUR',
            })}
          </span>
        </div>
        {!isTicketOnlyCart && (
          <div className='flex justify-between'>
            <span>Shipping ({regionLabel}):</span>
            <span>
              {formatCurrencyString({
                value: shippingCost,
                currency: 'EUR',
              })}
            </span>
          </div>
        )}
        {hasTickets && ticketVatCents > 0 && (
          <div className='flex justify-between text-gray-700'>
            <span>Ticket VAT (included):</span>
            <span>
              {formatCurrencyString({
                value: ticketVatCents,
                currency: 'EUR',
              })}
            </span>
          </div>
        )}
        {!isTicketOnlyCart && merchVatCents > 0 && (
          <div className='flex justify-between'>
            <span>Merch & shipping VAT ({merchVatRateLabel}):</span>
            <span>
              {formatCurrencyString({
                value: merchVatCents,
                currency: 'EUR',
              })}
            </span>
          </div>
        )}
        {!isTicketOnlyCart && merchVatCents === 0 && totalVAT > 0 && (
          <div className='flex justify-between'>
            <span>VAT ({merchVatRateLabel}):</span>
            <span>
              {formatCurrencyString({ value: totalVAT, currency: 'EUR' })}
            </span>
          </div>
        )}
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
