'use client';

import React, { useState, useEffect } from 'react';
import { useShoppingCart } from 'use-shopping-cart';

import { useShipping } from '../../_providers/ShippingProvider';
import { useCheckout, CustomerData } from '../../_providers/CheckoutProvider';
import {
  calculateCartShipping,
  type ShippingRegion,
} from '../../_types/shipping';
import {
  calculateOrderTotalsFromCartItems,
  DEFAULT_TICKET_VAT_RATE,
  type OrderTotalsBreakdown,
} from '../../../utilities/tax';
import {
  DEFAULT_CURRENCY,
  getCartCurrency,
} from '../../../utilities/currency';
import type { CheckoutStep } from '../../../utilities/checkoutSteps';
import {
  cartNeedsTicketDetails,
} from '../../../utilities/checkoutCart';

import EmptyCartState from './EmptyCartState';
import CartView from './CartView';
import CustomerInfoStep from './CustomerInfoStep';
import TicketDetailsStep from './TicketDetailsStep';
import PaymentStep from './PaymentStep';
import LoadingSpinner from './LoadingSpinner';

function getCartTaxInputs(cartDetails: Record<string, any> | null) {
  if (!cartDetails) return [];

  return Object.values(cartDetails).map((item: any) => {
    const metadata = item?.product_data?.metadata || {};
    const isTicket = metadata.type === 'ticket';

    return {
      type: metadata.type || 'merch',
      grossCents: item.price || 0,
      quantity: item.quantity || 1,
      vatRate: isTicket
        ? typeof metadata.vatRate === 'number'
          ? metadata.vatRate
          : DEFAULT_TICKET_VAT_RATE
        : undefined,
    };
  });
}

const CartPage = () => {
  const {
    cartDetails,
    cartCount,
    incrementItem,
    decrementItem,
    removeItem,
  } = useShoppingCart();

  const { selectedRegion, getRegionLabel } = useShipping();
  const {
    customerData,
    setCustomerData,
    hasCustomerData,
    syncTicketBuyerAnswersForCart,
    areTicketBuyerAnswersCompleteForCart,
    buyerQuestionDefsByLine,
    hydrateBuyerQuestionsForCart,
    isHydratingBuyerQuestions,
  } = useCheckout();
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('cart');
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [paymentRefreshKey, setPaymentRefreshKey] = useState(0);

  const includeTicketDetailsStep = cartNeedsTicketDetails(
    cartDetails as Record<string, any> | null,
    buyerQuestionDefsByLine
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialLoad(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    syncTicketBuyerAnswersForCart(
      cartDetails as Record<string, any> | null | undefined
    );
  }, [cartDetails, syncTicketBuyerAnswersForCart]);

  useEffect(() => {
    void hydrateBuyerQuestionsForCart(
      cartDetails as Record<string, any> | null | undefined
    );
  }, [cartDetails, hydrateBuyerQuestionsForCart]);

  useEffect(() => {
    if (checkoutStep !== 'payment') return;
    if (isHydratingBuyerQuestions) return;
    if (
      includeTicketDetailsStep &&
      !areTicketBuyerAnswersCompleteForCart(
        cartDetails as Record<string, any> | null
      )
    ) {
      setCheckoutStep('ticket-details');
    }
  }, [
    checkoutStep,
    includeTicketDetailsStep,
    isHydratingBuyerQuestions,
    cartDetails,
    areTicketBuyerAnswersCompleteForCart,
  ]);

  const getCompletedSteps = (): CheckoutStep[] => {
    const completed: CheckoutStep[] = ['cart'];

    if (hasCustomerData()) {
      completed.push('customer-info');
    }

    if (
      includeTicketDetailsStep &&
      areTicketBuyerAnswersCompleteForCart(
        cartDetails as Record<string, any> | null
      )
    ) {
      completed.push('ticket-details');
    }

    return completed;
  };

  const handleStepNavigation = (targetStep: CheckoutStep) => {
    const completedSteps = getCompletedSteps();

    if (
      targetStep === 'cart' ||
      completedSteps.includes(targetStep) ||
      targetStep === checkoutStep
    ) {
      if (targetStep === 'payment' && targetStep !== checkoutStep) {
        setPaymentRefreshKey((prev) => prev + 1);
      }
      setCheckoutStep(targetStep);
    }
  };

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
        type: metadata.type || 'merch',
        itemType: metadata.itemType || 'other',
      };
    });
  };

  const isTicketOnlyCart = () => {
    if (!cartDetails) return false;

    return Object.values(cartDetails).every((item: any) => {
      const metadata = item?.product_data?.metadata || {};
      return metadata.type === 'ticket';
    });
  };

  const hasTickets = () => {
    if (!cartDetails) return false;
    return Object.values(cartDetails).some((item: any) => {
      const metadata = item?.product_data?.metadata || {};
      return metadata.type === 'ticket';
    });
  };

  const shippingCostEuros = calculateCartShipping(
    getCartShippingData(),
    selectedRegion as ShippingRegion
  );
  const shippingCost = Math.round(shippingCostEuros * 100);

  const orderTotals: OrderTotalsBreakdown = calculateOrderTotalsFromCartItems(
    getCartTaxInputs(cartDetails),
    shippingCostEuros,
    selectedRegion as ShippingRegion
  );

  const subtotalExclVAT = Math.round(orderTotals.subtotal * 100);
  const totalVAT = Math.round(orderTotals.vat * 100);
  const finalTotal = Math.round(orderTotals.total * 100);
  const ticketVatCents = Math.round(orderTotals.ticketVat * 100);
  const merchVatCents = Math.round(
    (orderTotals.merchVat + orderTotals.shippingVat) * 100
  );
  const checkoutCurrency = getCartCurrency(cartDetails) || DEFAULT_CURRENCY;

  const goToPayment = () => {
    setPaymentRefreshKey((prev) => prev + 1);
    setCheckoutStep('payment');
  };

  const handleCustomerDataSubmit = (data: CustomerData) => {
    setCustomerData(data);
    if (includeTicketDetailsStep) {
      setCheckoutStep('ticket-details');
    } else {
      goToPayment();
    }
  };

  const handleTicketDetailsSubmit = () => {
    if (
      !areTicketBuyerAnswersCompleteForCart(
        cartDetails as Record<string, any> | null
      )
    ) {
      return;
    }
    goToPayment();
  };

  const handleProceedToCheckout = () => {
    setCheckoutStep('customer-info');
  };

  const stepProps = {
    includeTicketDetailsStep,
  };

  if (isInitialLoad) {
    return <LoadingSpinner message='Loading your cart...' />;
  }

  if (paymentProcessing) {
    return <LoadingSpinner message='Processing your payment...' />;
  }

  if (!cartDetails || cartCount === 0) {
    return <EmptyCartState />;
  }

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
        {...stepProps}
      />
    );
  }

  if (checkoutStep === 'ticket-details') {
    return (
      <TicketDetailsStep
        currentStep={checkoutStep}
        completedSteps={getCompletedSteps()}
        onStepNavigation={handleStepNavigation}
        cartDetails={cartDetails}
        onSubmit={handleTicketDetailsSubmit}
        isProcessing={isProcessing}
        {...stepProps}
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
        ticketVatCents={ticketVatCents}
        merchVatCents={merchVatCents}
        finalTotal={finalTotal}
        regionLabel={getRegionLabel()}
        selectedRegion={selectedRegion}
        shippingRegion={selectedRegion as ShippingRegion}
        isTicketOnlyCart={isTicketOnlyCart()}
        hasTickets={hasTickets()}
        paymentRefreshKey={paymentRefreshKey}
        orderTotals={orderTotals}
        currency={checkoutCurrency}
        {...stepProps}
      />
    );
  }

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
      ticketVatCents={ticketVatCents}
      merchVatCents={merchVatCents}
      finalTotal={finalTotal}
      regionLabel={getRegionLabel()}
      selectedRegion={selectedRegion}
      onProceedToCheckout={handleProceedToCheckout}
      isTicketOnlyCart={isTicketOnlyCart()}
      hasTickets={hasTickets()}
      currency={checkoutCurrency}
      {...stepProps}
    />
  );
};

export default CartPage;
