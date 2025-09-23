import React from 'react';
import StepIndicator from '../StepIndicator';
import OrderSummary from './OrderSummary';
import ReviewOrderItems from './ReviewOrderItems';
import ShippingAddressDisplay from './ShippingAddressDisplay';
import PaymentSection from './PaymentSection';
import PaymentErrorBoundary from './PaymentErrorBoundary';
import { CustomerData } from '../../_providers/CheckoutProvider';
import { type ShippingRegion } from '../../_types/shipping';

type CheckoutStep = 'cart' | 'customer-info' | 'payment';

interface PaymentStepProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepNavigation: (step: CheckoutStep) => void;
  customerData: CustomerData | null;
  cartDetails: any;
  subtotalExclVAT: number;
  shippingCost: number;
  totalVAT: number;
  finalTotal: number;
  regionLabel: string;
  selectedRegion: string;
  shippingRegion: ShippingRegion;
  isTicketOnlyCart?: boolean;
}

const PaymentStep: React.FC<PaymentStepProps> = ({
  currentStep,
  completedSteps,
  onStepNavigation,
  customerData,
  cartDetails,
  subtotalExclVAT,
  shippingCost,
  totalVAT,
  finalTotal,
  regionLabel,
  selectedRegion,
  shippingRegion,
  isTicketOnlyCart = false,
}) => {
  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
      <StepIndicator
        currentStep={currentStep}
        onStepClick={onStepNavigation}
        completedSteps={completedSteps}
      />
      <div className='mb-6'>
        <h2 className=' font-bold mb-2'>Review & Pay</h2>
        <p className='text-gray-600'>
          Review your order details and complete payment.
        </p>
      </div>

      {/* Order Items */}
      <div className='mb-6'>
        <ReviewOrderItems cartDetails={cartDetails} />
      </div>

      {/* First Row - Order Summary & Shipping Address */}
      {!isTicketOnlyCart && (
        <div className={`grid gap-6 mb-8 'grid-cols-1 md:grid-cols-2'`}>
          <OrderSummary
            subtotalExclVAT={subtotalExclVAT}
            shippingCost={shippingCost}
            totalVAT={totalVAT}
            finalTotal={finalTotal}
            regionLabel={regionLabel}
            selectedRegion={selectedRegion}
            title={'Order Summary'}
          />

          <ShippingAddressDisplay
            customerData={customerData}
            onEditCustomerInfo={() => onStepNavigation('customer-info')}
          />
        </div>
      )}

      {/* Second Row - Payment */}
      <PaymentErrorBoundary onRetry={() => window.location.reload()}>
        <PaymentSection
          customerData={customerData}
          orderTotals={{
            subtotal: subtotalExclVAT / 100,
            shipping: shippingCost / 100,
            vat: totalVAT / 100,
            total: finalTotal / 100,
          }}
          shippingRegion={shippingRegion}
        />
      </PaymentErrorBoundary>
    </div>
  );
};

export default PaymentStep;
