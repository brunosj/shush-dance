'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { BsTrash3 } from 'react-icons/bs';
import { formatCurrencyString } from 'use-shopping-cart';
import { useRouter } from 'next/navigation';

import { useShipping } from '../../_providers/ShippingProvider';
import { useCheckout, CustomerData } from '../../_providers/CheckoutProvider';
import {
  calculateCartShipping,
  calculateVAT,
  SHIPPING_LOCATIONS,
  type ShippingRegion,
} from '../../_types/shipping';
import ShippingLocationSelector from '../ShippingLocationSelector';
import CustomerDataForm from '../CustomerDataForm';
import StepIndicator from '../StepIndicator';
import StripeCheckoutButton from '../StripeCheckoutButton';

type CheckoutStep = 'cart' | 'customer-info' | 'payment';

const CartPage = () => {
  const {
    cartDetails,
    cartCount,
    totalPrice,
    incrementItem,
    decrementItem,
    removeItem,
    clearCart,
  } = useShoppingCart();

  const { selectedRegion, getRegionLabel } = useShipping();
  const { customerData, setCustomerData, hasCustomerData, clearCustomerData } =
    useCheckout();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currency] = useState('EUR');

  const router = useRouter();

  const navigateToSuccess = () => {
    router.push('/success');
  };

  const navigateToError = () => {
    router.push('/error');
  };

  // Determine which steps are completed
  const getCompletedSteps = (): CheckoutStep[] => {
    const completed: CheckoutStep[] = ['cart']; // Cart is always completed

    if (hasCustomerData()) {
      completed.push('customer-info');
    }

    return completed;
  };

  // Handle step navigation from step indicator
  const handleStepNavigation = (targetStep: CheckoutStep) => {
    const completedSteps = getCompletedSteps();

    // Allow navigation to completed steps or current step
    if (
      targetStep === 'cart' ||
      completedSteps.includes(targetStep) ||
      targetStep === checkoutStep
    ) {
      setCheckoutStep(targetStep);
    }
  };

  if (!cartDetails || cartCount === 0) {
    return (
      <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12 text-center'>
        <h2 className='text-2xl font-bold mb-4'>Your cart is empty</h2>
        <p className='text-gray-600'>
          Add some items to your cart to see them here.
        </p>
      </div>
    );
  }

  // Helper function to convert CartDetails to the format expected by calculateCartShipping
  const getCartShippingData = () => {
    if (!cartDetails) return [];

    return Object.values(cartDetails).map((item) => {
      const productData = item?.product_data as any;
      const metadata = productData?.metadata || {};

      const shippingPrices = metadata.shippingPrices
        ? JSON.parse(metadata.shippingPrices)
        : {
            germany: 5.5,
            germanyAdditional: 2.5,
            eu: 10.0,
            euAdditional: 5.0,
            restOfWorld: 15.0,
            restOfWorldAdditional: 8.0,
          };

      return {
        shippingPrices,
        quantity: item?.quantity || 1,
        isDigital: metadata.isDigital === 'true',
      };
    });
  };

  // Get VAT rate for selected region
  const getVATRate = () => {
    const location = SHIPPING_LOCATIONS.find(
      (loc) => loc.region === selectedRegion
    );
    return location?.vatRate || 0;
  };

  // Calculate totals
  const subtotalExclVAT = totalPrice || 0;
  const shippingCostEuros = calculateCartShipping(
    getCartShippingData(),
    selectedRegion
  );
  const shippingCost = Math.round(shippingCostEuros * 100);
  const vatRate = getVATRate();

  const subtotalVAT = Math.round(
    calculateVAT(subtotalExclVAT / 100, vatRate) * 100
  );
  const shippingVAT = Math.round(
    calculateVAT(shippingCost / 100, vatRate) * 100
  );
  const totalVAT = subtotalVAT + shippingVAT;

  const finalTotal = subtotalExclVAT + shippingCost + totalVAT;

  const handleCustomerDataSubmit = (data: CustomerData) => {
    setCustomerData(data);
    setCheckoutStep('payment');
  };

  // Render based on checkout step
  if (checkoutStep === 'customer-info') {
    return (
      <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
        <StepIndicator
          currentStep={checkoutStep}
          onStepClick={handleStepNavigation}
          completedSteps={getCompletedSteps()}
        />
        {/* <div className='mb-6'>
          <h2 className='text-2xl font-bold mb-2'>Customer Information</h2>
          <p className='text-gray-600'>
            Please provide your shipping details to continue.
          </p>
        </div> */}

        <CustomerDataForm
          onSubmit={handleCustomerDataSubmit}
          isSubmitting={isProcessing}
          initialData={customerData}
        />
      </div>
    );
  }

  if (checkoutStep === 'payment') {
    return (
      <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
        <StepIndicator
          currentStep={checkoutStep}
          onStepClick={handleStepNavigation}
          completedSteps={getCompletedSteps()}
        />
        <div className='mb-6'>
          <h2 className='text-2xl font-bold mb-2'>Review & Pay</h2>
          <p className='text-gray-600'>
            Review your order details and complete payment.
          </p>
        </div>

        {/* First Row - Order Summary & Shipping Address */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-6 mb-8'>
          {/* Order Summary */}
          <div className='bg-gray-50 p-6 rounded-lg'>
            <h3 className='text-lg font-semibold mb-4'>Order Summary</h3>
            <div className='space-y-2'>
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
                <span>Shipping ({getRegionLabel()}):</span>
                <span>
                  {formatCurrencyString({
                    value: shippingCost,
                    currency: 'EUR',
                  })}
                </span>
              </div>
              <div className='flex justify-between'>
                <span>
                  VAT ({selectedRegion === 'germany' ? '19%' : '0%'}):
                </span>
                <span>
                  {formatCurrencyString({ value: totalVAT, currency: 'EUR' })}
                </span>
              </div>
              <hr className='my-2' />
              <div className='flex justify-between font-semibold text-lg'>
                <span>Total:</span>
                <span>
                  {formatCurrencyString({
                    value: finalTotal,
                    currency: 'EUR',
                  })}
                </span>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          <div className='bg-gray-50 p-6 rounded-lg'>
            <h3 className='text-lg font-semibold mb-4'>Shipping Address</h3>
            <div className='text-sm text-gray-700'>
              <p className='font-medium'>
                {customerData?.firstName} {customerData?.lastName}
              </p>
              <p>{customerData?.street}</p>
              <p>
                {customerData?.city}, {customerData?.postalCode}
              </p>
              <p>{customerData?.country}</p>
              {customerData?.phone && (
                <p className='mt-2'>Phone: {customerData.phone}</p>
              )}
              {customerData?.customerNotes && (
                <div className='mt-3 pt-3 border-t border-gray-200'>
                  <p className='font-medium text-xs text-gray-500 uppercase tracking-wide'>
                    Order Notes:
                  </p>
                  <p className='text-sm'>{customerData.customerNotes}</p>
                </div>
              )}
            </div>

            {/* Edit Customer Info Button */}
            <button
              onClick={() => setCheckoutStep('customer-info')}
              className='mt-4 text-sm text-blue-600 hover:text-blue-800 underline'
            >
              Edit customer information
            </button>
          </div>
        </div>

        {/* Second Row - Payment */}
        <div className='bg-gray-50 p-6 rounded-lg'>
          <h3 className='text-lg font-semibold mb-4'>Payment Information</h3>
          <p className='text-sm text-gray-600 mb-6'>
            Complete your payment securely with Stripe. PayPal users can select
            PayPal as a payment method within Stripe.
          </p>

          <StripeCheckoutButton
            customerData={customerData}
            orderTotals={{
              subtotal: subtotalExclVAT / 100,
              shipping: shippingCost / 100,
              vat: totalVAT / 100,
              total: finalTotal / 100,
            }}
            shippingRegion={selectedRegion}
          />
        </div>
      </div>
    );
  }

  // Default cart view
  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
      <StepIndicator
        currentStep={checkoutStep}
        onStepClick={handleStepNavigation}
        completedSteps={getCompletedSteps()}
      />

      <ul className='space-y-4 pt-6'>
        {Object.entries(cartDetails || {}).map(([key, item]) => {
          // Extract metadata from product_data
          const productData = item?.product_data as any;
          const metadata = productData?.metadata || {};
          const variant = metadata.variant;

          // Calculate proper price display
          const unitPrice = item?.price ? item.price / 100 : 0; // Convert from cents
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

      {/* Shipping Location Selector - moved below cart items */}
      <div className='mt-6 mb-6'>
        <ShippingLocationSelector />
      </div>

      {/* Cart Summary */}
      <div className='bg-gray-50 p-6 rounded-lg'>
        <h3 className='text-lg font-semibold mb-4'>Order Summary</h3>
        <div className='space-y-2'>
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
            <span>Shipping ({getRegionLabel()}):</span>
            <span>
              {formatCurrencyString({ value: shippingCost, currency: 'EUR' })}
            </span>
          </div>
          <div className='flex justify-between'>
            <span>VAT ({selectedRegion === 'germany' ? '19%' : '0%'}):</span>
            <span>
              {formatCurrencyString({ value: totalVAT, currency: 'EUR' })}
            </span>
          </div>
          <hr className='my-2' />
          <div className='flex justify-between font-semibold text-lg'>
            <span>Total:</span>
            <span>
              {formatCurrencyString({ value: finalTotal, currency: 'EUR' })}
            </span>
          </div>
        </div>

        <button
          onClick={() => setCheckoutStep('customer-info')}
          className='w-full mt-6 bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors'
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
