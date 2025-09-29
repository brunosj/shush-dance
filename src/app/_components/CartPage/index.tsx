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
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);

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
      // Force refresh payment when navigating back to payment step
      if (targetStep === 'payment' && targetStep !== checkoutStep) {
        setPaymentRefreshKey((prev) => prev + 1);
      }
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
        isDigital: metadata.isDigital === 'true' || metadata.type === 'ticket',
        type: metadata.type || 'merch', // 'release', 'merch', or 'ticket'
        itemType: metadata.itemType || 'other', // 'vinyl', 'clothing', 'prints', 'ticket', 'other'
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

  // Separate taxable and non-taxable items for VAT calculation
  const getTaxableSubtotal = () => {
    if (!cartDetails) return 0;

    return Object.values(cartDetails).reduce((total: number, item: any) => {
      const productData = item?.product_data as any;
      const metadata = productData?.metadata || {};
      const isTicket = metadata.type === 'ticket';

      // Only include non-ticket items in taxable subtotal
      if (!isTicket) {
        return total + (item.value || 0);
      }
      return total;
    }, 0);
  };

  const taxableSubtotal = getTaxableSubtotal();
  const subtotalVAT = Math.round(
    calculateVAT(taxableSubtotal / 100, vatRate) * 100
  );
  const shippingVAT = Math.round(
    calculateVAT(shippingCost / 100, vatRate) * 100
  );
  const totalVAT = subtotalVAT + shippingVAT;

  const finalTotal = subtotalExclVAT + shippingCost + totalVAT;

  // Check if cart contains only tickets
  const isTicketOnlyCart = () => {
    if (!cartDetails) return false;

    return Object.values(cartDetails).every((item: any) => {
      const productData = item?.product_data as any;
      const metadata = productData?.metadata || {};
      return metadata.type === 'ticket';
    });
  };

  const handleCustomerDataSubmit = (data: CustomerData) => {
    setCustomerData(data);
    // Force refresh payment when proceeding to payment step
    setPaymentRefreshKey((prev) => prev + 1);
    setCheckoutStep('payment');
  };

  const handleProceedToCheckout = () => {
    // Always go to customer-info step, but it will show different form for tickets
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
        isTicketOnlyCart={isTicketOnlyCart()}
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
        cartDetails={cartDetails}
        subtotalExclVAT={subtotalExclVAT}
        shippingCost={shippingCost}
        totalVAT={totalVAT}
        finalTotal={finalTotal}
        regionLabel={getRegionLabel()}
        selectedRegion={selectedRegion}
        shippingRegion={selectedRegion}
        isTicketOnlyCart={isTicketOnlyCart()}
        paymentRefreshKey={paymentRefreshKey}
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
      isTicketOnlyCart={isTicketOnlyCart()}
    />
  );
};

export default CartPage;
