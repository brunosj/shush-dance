import React from 'react';
import StepIndicator from '../StepIndicator';
import CartItemsList from './CartItemsList';
import OrderSummary from './OrderSummary';
import ShippingLocationSelector from '../ShippingLocationSelector';

type CheckoutStep = 'cart' | 'customer-info' | 'payment';

interface CartViewProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepNavigation: (step: CheckoutStep) => void;
  cartDetails: any;
  incrementItem: (id: string) => void;
  decrementItem: (id: string) => void;
  removeItem: (id: string) => void;
  subtotalExclVAT: number;
  shippingCost: number;
  totalVAT: number;
  finalTotal: number;
  regionLabel: string;
  selectedRegion: string;
  onProceedToCheckout: () => void;
  isTicketOnlyCart?: boolean;
}

const CartView: React.FC<CartViewProps> = ({
  currentStep,
  completedSteps,
  onStepNavigation,
  cartDetails,
  incrementItem,
  decrementItem,
  removeItem,
  subtotalExclVAT,
  shippingCost,
  totalVAT,
  finalTotal,
  regionLabel,
  selectedRegion,
  onProceedToCheckout,
  isTicketOnlyCart = false,
}) => {
  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
      <StepIndicator
        currentStep={currentStep}
        onStepClick={onStepNavigation}
        completedSteps={completedSteps}
      />

      <CartItemsList
        cartDetails={cartDetails}
        incrementItem={incrementItem}
        decrementItem={decrementItem}
        removeItem={removeItem}
      />

      {/* Shipping Location Selector - only show for physical items */}
      {!isTicketOnlyCart && (
        <div className='mt-6 mb-6'>
          <ShippingLocationSelector />
        </div>
      )}

      {/* Cart Summary */}
      <OrderSummary
        subtotalExclVAT={subtotalExclVAT}
        shippingCost={shippingCost}
        totalVAT={totalVAT}
        finalTotal={finalTotal}
        regionLabel={regionLabel}
        selectedRegion={selectedRegion}
        onProceedToCheckout={onProceedToCheckout}
        showProceedButton={true}
        isTicketOnlyCart={isTicketOnlyCart}
      />
    </div>
  );
};

export default CartView;
