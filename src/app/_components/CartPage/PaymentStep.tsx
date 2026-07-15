import React from 'react';
import StepIndicator from '../StepIndicator';
import OrderSummary from './OrderSummary';
import ReviewOrderItems from './ReviewOrderItems';
import ShippingAddressDisplay from './ShippingAddressDisplay';
import PaymentSection from './PaymentSection';
import PaymentErrorBoundary from './PaymentErrorBoundary';
import { CustomerData } from '../../_providers/CheckoutProvider';
import { type ShippingRegion } from '../../_types/shipping';
import type { OrderTotalsBreakdown } from '../../../utilities/tax';

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
  ticketVatCents?: number;
  merchVatCents?: number;
  finalTotal: number;
  regionLabel: string;
  selectedRegion: string;
  shippingRegion: ShippingRegion;
  isTicketOnlyCart?: boolean;
  hasTickets?: boolean;
  paymentRefreshKey?: number;
  orderTotals: OrderTotalsBreakdown;
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
  ticketVatCents = 0,
  merchVatCents = 0,
  finalTotal,
  regionLabel,
  selectedRegion,
  shippingRegion,
  isTicketOnlyCart = false,
  hasTickets = false,
  paymentRefreshKey = 0,
  orderTotals,
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

      <div className='mb-6'>
        <ReviewOrderItems cartDetails={cartDetails} />
      </div>

      <div
        className={`grid gap-6 mb-8 ${
          isTicketOnlyCart ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'
        }`}
      >
        <OrderSummary
          subtotalExclVAT={subtotalExclVAT}
          shippingCost={shippingCost}
          totalVAT={totalVAT}
          ticketVatCents={ticketVatCents}
          merchVatCents={merchVatCents}
          finalTotal={finalTotal}
          regionLabel={regionLabel}
          selectedRegion={selectedRegion}
          title={'Order Summary'}
          isTicketOnlyCart={isTicketOnlyCart}
          hasTickets={hasTickets}
        />

        {!isTicketOnlyCart && (
          <ShippingAddressDisplay
            customerData={customerData}
            onEditCustomerInfo={() => onStepNavigation('customer-info')}
          />
        )}
      </div>

      <PaymentErrorBoundary onRetry={() => window.location.reload()}>
        <PaymentSection
          key={paymentRefreshKey}
          customerData={customerData}
          orderTotals={orderTotals}
          shippingRegion={shippingRegion}
        />
      </PaymentErrorBoundary>
    </div>
  );
};

export default PaymentStep;
