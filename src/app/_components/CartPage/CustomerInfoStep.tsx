import React from 'react';
import StepIndicator from '../StepIndicator';
import CustomerDataForm from '../CustomerDataForm';
import { CustomerData } from '../../_providers/CheckoutProvider';

type CheckoutStep = 'cart' | 'customer-info' | 'payment';

interface CustomerInfoStepProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepNavigation: (step: CheckoutStep) => void;
  onSubmit: (data: CustomerData) => void;
  isProcessing: boolean;
  customerData: CustomerData | null;
}

const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
  currentStep,
  completedSteps,
  onStepNavigation,
  onSubmit,
  isProcessing,
  customerData,
}) => {
  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
      <StepIndicator
        currentStep={currentStep}
        onStepClick={onStepNavigation}
        completedSteps={completedSteps}
      />

      <CustomerDataForm
        onSubmit={onSubmit}
        isSubmitting={isProcessing}
        initialData={customerData}
      />
    </div>
  );
};

export default CustomerInfoStep;
