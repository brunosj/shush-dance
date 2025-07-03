'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { BsTrash3, BsPaypal, BsCreditCard } from 'react-icons/bs';
import { formatCurrencyString } from 'use-shopping-cart';
import { useRouter } from 'next/navigation';
import {
  PayPalButtons,
  PayPalButtonsComponentProps,
} from '@paypal/react-paypal-js';
import { useShipping } from '../../../_providers/ShippingProvider';
import {
  calculateCartShipping,
  calculateVAT,
  SHIPPING_LOCATIONS,
  type ShippingRegion,
} from '../../../_types/shipping';
import ShippingLocationSelector from '../../ShippingLocationSelector';
import CustomerDataForm, { CustomerData } from '../../CustomerDataForm';
import StepIndicator from '../../StepIndicator';
import PaymentMethodRadio from '../../PaymentMethod';
import StripeCheckoutButton from '../../StripeCheckoutButton';

type CheckoutStep = 'cart' | 'customer-info' | 'payment';

const CartPageV2 = () => {
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
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [customerData, setCustomerData] = useState<CustomerData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'stripe' | 'paypal'>(
    'stripe'
  );
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

    if (customerData) {
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
        type: metadata.type || 'merch', // 'release' or 'merch'
        itemType: metadata.itemType || 'other', // 'vinyl', 'clothing', 'prints', 'other'
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

  // Format items for PayPal with safety checks
  const formatItemsForPayPal = () => {
    // Only include actual products, not shipping (shipping is handled in breakdown)
    const items = Object.values(cartDetails || {}).map((item) => ({
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

    // Calculate current sum of individual items
    const itemsSum = items.reduce((total, item) => {
      return (
        total + parseFloat(item.unit_amount.value) * parseInt(item.quantity)
      );
    }, 0);

    const expectedItemTotal = subtotalExclVAT / 100;
    const difference = expectedItemTotal - itemsSum;

    // If there's a rounding difference, adjust the first item
    if (Math.abs(difference) > 0.001 && items.length > 0) {
      const firstItemPrice = parseFloat(items[0].unit_amount.value);
      const firstItemQuantity = parseInt(items[0].quantity);
      const adjustedPrice = (
        firstItemPrice +
        difference / firstItemQuantity
      ).toFixed(2);

      items[0].unit_amount.value = adjustedPrice;
    }

    return items;
  };

  // Styling for the PayPal buttons
  const styles = {
    shape: 'sharp',
    layout: 'vertical',
    color: 'black',
    height: 40,
  };

  const createOrder = (data: any, actions: any) => {
    const items = formatItemsForPayPal();

    // Use the consistent subtotal from use-shopping-cart for item_total
    const itemTotalValue = (subtotalExclVAT / 100).toFixed(2);
    const shippingValue = (shippingCost / 100).toFixed(2);
    const taxValue = (totalVAT / 100).toFixed(2);
    const totalValue = (finalTotal / 100).toFixed(2);

    return actions.order.create({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: currency,
            value: totalValue,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: itemTotalValue,
              },
              shipping: {
                currency_code: currency,
                value: shippingValue,
              },
              tax_total: {
                currency_code: currency,
                value: taxValue,
              },
            },
          },
          items: items,
        },
      ],
    });
  };

  const onApprove = async (data: any, actions: any) => {
    try {
      const details = await actions.order.capture();

      // Create order record first
      if (customerData) {
        await createOrderRecord('paypal', details.id);
      }

      // Create sales records for each item
      await createSalesRecords('paypal', details.id);

      await clearCart();
      navigateToSuccess();
    } catch (err) {
      console.error('PayPal error:', err);
      navigateToError();
    }
  };

  // Function to create order record
  const createOrderRecord = async (
    paymentMethod: string,
    transactionId: string
  ) => {
    if (!customerData) return;

    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const orderData = {
      orderNumber,
      customerData,
      cartItems: Object.entries(cartDetails).map(([key, item]) => ({
        id: key,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.price * item.quantity,
      })),
      totals: {
        subtotal: subtotalExclVAT / 100,
        shipping: shippingCost / 100,
        vat: totalVAT / 100,
        total: finalTotal / 100,
      },
      shippingRegion: selectedRegion,
      paymentMethod,
      transactionId,
    };

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        console.error('Failed to create order record');
      }
    } catch (error) {
      console.error('Error creating order record:', error);
    }
  };

  // Function to create sales records
  const createSalesRecords = async (
    paymentMethod: string,
    transactionId: string
  ) => {
    if (!cartDetails) return;

    const salesPromises = Object.values(cartDetails).map(async (item) => {
      const productData = item?.product_data as any;
      const metadata = productData?.metadata;

      if (!metadata) return;

      const basePrice = parseFloat(metadata.basePrice || '0');
      const shippingPrices = metadata.shippingPrices
        ? JSON.parse(metadata.shippingPrices)
        : {};
      const isDigital = metadata.isDigital === 'true';
      const quantity = item?.quantity || 1;

      // Calculate shipping for this item
      const itemShipping = isDigital
        ? 0
        : calculateCartShipping(
            [
              {
                shippingPrices,
                quantity,
                isDigital,
                type: metadata.type || 'merch',
                itemType: metadata.itemType || 'other',
              },
            ],
            selectedRegion
          );

      const subtotal = basePrice * quantity;
      const shippingTotal = itemShipping;
      const itemVAT = subtotal * vatRate;
      const shippingVATAmount = shippingTotal * vatRate;
      const totalVATAmount = itemVAT + shippingVATAmount;
      const totalAmount = subtotal + shippingTotal + totalVATAmount;

      // Create sale record
      try {
        const response = await fetch('/api/create-sale', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            itemId: metadata.itemId,
            itemType: metadata.type,
            itemName: item?.name || 'Unknown Item',
            quantity,
            basePrice,
            shippingPrice: shippingTotal,
            vatAmount: totalVATAmount,
            totalAmount,
            currency: 'EUR',
            paymentMethod,
            shippingRegion: selectedRegion,
            transactionId,
            customerEmail: customerData?.email,
          }),
        });

        if (!response.ok) {
          console.error('Failed to create sale record for item:', item?.name);
        }
      } catch (error) {
        console.error('Error creating sale record:', error);
      }
    });

    await Promise.all(salesPromises);
  };

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
        <div className='mb-6'>
          <h2 className='text-2xl font-bold mb-2'>Customer Information</h2>
          <p className='text-gray-600'>
            Please provide your shipping details to continue.
          </p>
        </div>

        <CustomerDataForm
          onSubmit={handleCustomerDataSubmit}
          isSubmitting={isProcessing}
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

        <div className='bg-gray-50 p-6 rounded-lg mb-6'>
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
        </div>

        <div className='bg-gray-50 p-6 rounded-lg mb-6'>
          <h3 className='text-lg font-semibold mb-4'>Shipping Address</h3>
          <p>
            {customerData?.firstName} {customerData?.lastName}
            <br />
            {customerData?.street}
            <br />
            {customerData?.city}, {customerData?.postalCode}
            <br />
            {customerData?.country}
          </p>
        </div>

        {/* Payment Method Selection */}
        <div className='bg-gray-50 p-6 rounded-lg mb-6'>
          <h3 className='text-lg font-semibold mb-4'>Payment Method</h3>
          <div className='space-y-4'>
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
        </div>

        {/* Payment Buttons */}
        <div className='space-y-4 w-1/2 mx-auto'>
          {paymentMethod === 'paypal' && (
            <PayPalButtons
              style={styles as PayPalButtonsComponentProps['style']}
              createOrder={createOrder}
              onApprove={onApprove}
              onError={(err) => {
                console.error('PayPal error:', err);
                navigateToError();
              }}
            />
          )}

          {paymentMethod === 'stripe' && (
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
          )}
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
        {Object.entries(cartDetails || {}).map(([key, item]) => (
          <li
            key={key}
            className='flex justify-between flex-col border-b pb-3 lg:pb-6 space-y-2 border-gray'
          >
            <div className='flex flex-col'>
              <h4 className='font-bold '>{item?.name || 'Product'}</h4>
              <p className='text-darkGray'>
                {item?.description || 'Unknown'} |{' '}
                {item?.priceObject
                  ? formatCurrencyString(item.priceObject)
                  : '€0.00'}
              </p>
            </div>
            <div className='ml-auto flex items-center gap-2 space-x-3'>
              <button
                onClick={() => decrementItem(key)}
                className='bg-white border border-gray-300 text-black px-2 py-1'
                disabled={item?.quantity <= 1}
              >
                -
              </button>
              <span className='text-sm lg:text-base'>{item?.quantity}</span>
              <button
                onClick={() => incrementItem(key)}
                className='bg-white border border-gray-300 text-black px-2 py-1'
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

export default CartPageV2;
