'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import { useRouter } from 'next/navigation';

import { useShipping } from '../../_providers/ShippingProvider';
import { useCheckout, CustomerData } from '../../_providers/CheckoutProvider';
import {
  calculateCartShipping,
  calculateVAT,
  SHIPPING_LOCATIONS,
  type ShippingRegion,
} from '../../_types/shipping';

// Import the new components
import EmptyCartState from './EmptyCartState';
import CartView from './CartView';
import CustomerInfoStep from './CustomerInfoStep';
import PaymentStep from './PaymentStep';
import LoadingSpinner from './LoadingSpinner';

type CheckoutStep = 'cart' | 'customer-info' | 'payment';

const CartPage = () => {
  const {
    cartDetails,
    cartCount,
    totalPrice,
    incrementItem,
    decrementItem,
    removeItem,
  } = useShoppingCart();

  const { selectedRegion, getRegionLabel } = useShipping();
  const { customerData, setCustomerData, hasCustomerData } = useCheckout();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);

  const router = useRouter();

  // Handle initial loading state
  useEffect(() => {
    // Add a small delay to prevent flash of empty state
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

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

  // Helper function to convert CartDetails to the format expected by calculateCartShipping
  const getCartShippingData = () => {
    if (!cartDetails) return [];

    return Object.values(cartDetails).map((item: any) => {
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

  const handleCustomerDataSubmit = (data: CustomerData) => {
    setCustomerData(data);
    setCheckoutStep('payment');
  };

  const handleProceedToCheckout = () => {
    setCheckoutStep('customer-info');
  };

  // Show loading spinner during initial load or payment processing
  if (isInitialLoad) {
    return <LoadingSpinner message='Loading your cart...' />;
  }

  // Show payment processing spinner instead of empty cart state
  if (paymentProcessing) {
    return <LoadingSpinner message='Processing your payment...' />;
  }

  // Show empty cart state only if cart is actually empty and not processing
  if (!cartDetails || cartCount === 0) {
    return <EmptyCartState />;
  }

  // Render based on checkout step
  if (checkoutStep === 'customer-info') {
    return (
      <CustomerInfoStep
        currentStep={checkoutStep}
        completedSteps={getCompletedSteps()}
        onStepNavigation={handleStepNavigation}
        onSubmit={handleCustomerDataSubmit}
        isProcessing={isProcessing}
        customerData={customerData}
      />
    );
  }

  if (checkoutStep === 'payment') {
    return (
      <PaymentStep
        currentStep={checkoutStep}
        completedSteps={getCompletedSteps()}
        onStepNavigation={handleStepNavigation}
        customerData={customerData}
        subtotalExclVAT={subtotalExclVAT}
        shippingCost={shippingCost}
        totalVAT={totalVAT}
        finalTotal={finalTotal}
        regionLabel={getRegionLabel()}
        selectedRegion={selectedRegion}
        shippingRegion={selectedRegion}
      />
    );
  }

  // Default cart view
  return (
    <CartView
      currentStep={checkoutStep}
      completedSteps={getCompletedSteps()}
      onStepNavigation={handleStepNavigation}
      cartDetails={cartDetails}
      incrementItem={incrementItem}
      decrementItem={decrementItem}
      removeItem={removeItem}
      subtotalExclVAT={subtotalExclVAT}
      shippingCost={shippingCost}
      totalVAT={totalVAT}
      finalTotal={finalTotal}
      regionLabel={getRegionLabel()}
      selectedRegion={selectedRegion}
      onProceedToCheckout={handleProceedToCheckout}
    />
  );
};

export default CartPage;
