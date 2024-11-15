'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { formatCurrencyString } from 'use-shopping-cart';
import { BsTrash3 } from 'react-icons/bs';
import Button from '../Button';
import type { Page } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import PaymentMethodRadio from '../PaymentMethod';
import { BsPaypal, BsCreditCard } from 'react-icons/bs';
import StripeCheckoutButton from '../StripeCheckoutButton';
import {
  PayPalButtons,
  PayPalButtonsComponentProps,
} from '@paypal/react-paypal-js';
import { useRouter } from 'next/router';

interface CartPageProps {
  data: {
    page: { data: Page | null | undefined };
  };
}

const CartTest: React.FC<CartPageProps> = ({ data }) => {
  const { page } = data;
  const {
    cartCount,
    cartDetails,
    formattedTotalPrice,
    totalPrice,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
    redirectToCheckout,
  } = useShoppingCart();

  const [isLoading, setIsLoading] = useState(true);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>(
    'stripe'
  );
  const [currency, setCurrency] = useState('EUR');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const navigateToSuccess = () => {
    if (isMounted) {
      const router = useRouter();
      router.push('/success');
    }
  };

  const navigateToError = () => {
    if (isMounted) {
      const router = useRouter();
      router.push('/error');
    }
  };

  useEffect(() => {
    if (cartCount !== undefined) {
      setIsLoading(false);
    }
  }, [cartCount]);

  // Format items for PayPal with safety checks
  const formatItemsForPayPal = () =>
    Object.values(cartDetails || {}).map((item) => ({
      name: item?.name || 'Product',
      description: item?.description || '',
      unit_amount: {
        currency_code: currency,
        value: (item?.priceObject?.value
          ? item.priceObject.value / 100
          : 0
        ).toFixed(2),
      },
      quantity: item?.quantity?.toString() || '1',
    }));

  // Styling for the Paypal buttons
  const styles: PayPalButtonsComponentProps['style'] = {
    shape: 'sharp',
    layout: 'vertical',
    color: 'black',
    height: 40,
  };

  // Handle Checkout for Stripe or PayPal
  const handleCheckout = async () => {
    if (paymentMethod === 'stripe') {
      try {
        const result = await redirectToCheckout();
        if (result?.error) {
          console.error('Error during checkout:', result.error);
        } else {
          // Clear the cart after successful payment
          clearCart();
          navigateToSuccess();
        }
      } catch (error) {
        console.error('Checkout error:', error);
      }
    }
  };

  if (!page) return <p>Loading...</p>;
  if (isLoading)
    return (
      <p className='text-center mt-32 text-base lg:text-xl'>
        Loading your cart...
      </p>
    );
  if (!cartDetails || Object.keys(cartDetails).length === 0) {
    return (
      <div className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
        <h1 className='text-base lg:text-xl'>Your cart is empty</h1>
        <Button href='/' label='Return to home' />
      </div>
    );
  }

  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-32'>
      <ul className='space-y-4'>
        {Object.entries(cartDetails || {}).map(([key, item]) => (
          <li
            key={key}
            className='flex justify-between flex-col border-b pb-3 lg:pb-6 space-y-2 border-gray'
          >
            <div className='flex flex-col'>
              <h4 className='font-bold '>{item?.parentItem || 'Product'}</h4>
              <p className='text-darkGray'>
                {item?.name || 'Unknown'} |{' '}
                {item?.priceObject
                  ? formatCurrencyString(item.priceObject)
                  : '€0.00'}
              </p>
            </div>
            <div className='ml-auto flex items-center gap-2 space-x-3'>
              <button
                onClick={() => decrementItem(key)}
                className='bg-gray-200 text-black px-2 py-1'
                disabled={item?.quantity <= 1}
              >
                -
              </button>
              <span className='text-sm lg:text-base'>{item?.quantity}</span>
              <button
                onClick={() => incrementItem(key)}
                className='bg-gray-200 text-black px-2 py-1'
              >
                +
              </button>
              <div className='h-6 border-l border-gray'></div>
              <p>{item?.formattedValue}</p>
              <div className='h-6 border-l border-gray'></div>
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

        {/* Payment Method Radio Buttons */}
        <div className='ml-0 lg:ml-auto space-y-4'>
          <PaymentMethodRadio
            label='Pay with Credit Card (Stripe)'
            icon={<BsCreditCard />}
            value='stripe'
            selectedPaymentMethod={paymentMethod}
            onChange={setPaymentMethod}
          />
          <PaymentMethodRadio
            label='Pay with PayPal'
            icon={<BsPaypal />}
            value='paypal'
            selectedPaymentMethod={paymentMethod}
            onChange={setPaymentMethod}
          />
        </div>

        <div className='ml-auto'>
          {/* PayPal Buttons */}
          {paymentMethod === 'paypal' && (
            <PayPalButtons
              createOrder={(data, actions) => {
                return actions.order.create({
                  intent: 'CAPTURE',
                  purchase_units: [
                    {
                      amount: {
                        currency_code: currency,
                        value: (totalPrice / 100).toFixed(2),
                        breakdown: {
                          item_total: {
                            currency_code: currency,
                            value: (totalPrice / 100).toFixed(2),
                          },
                        },
                      },
                      items: formatItemsForPayPal(),
                    },
                  ],
                });
              }}
              onApprove={async (data, actions) => {
                try {
                  const details = await actions.order.capture();
                  clearCart();
                  navigateToSuccess();
                } catch (err) {
                  console.error('PayPal error:', err);
                }
              }}
              onError={(err) => {
                console.error('PayPal error:', err);
                navigateToError();
              }}
              style={styles}
            />
          )}

          {/* Stripe Checkout Button */}
          {paymentMethod === 'stripe' && <StripeCheckoutButton />}
        </div>
      </div>

      <div className='mt-12 mb-24 lg:mt-24 lg:mb-32'>
        <RichText content={page.data.content} className='richTextSmallP' />
      </div>
    </div>
  );
};

export default CartTest;
