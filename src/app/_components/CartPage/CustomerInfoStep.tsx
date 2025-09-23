import React, { useState } from 'react';
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
  isTicketOnlyCart?: boolean;
}

const CustomerInfoStep: React.FC<CustomerInfoStepProps> = ({
  currentStep,
  completedSteps,
  onStepNavigation,
  onSubmit,
  isProcessing,
  customerData,
  isTicketOnlyCart = false,
}) => {
  const [ticketCustomerData, setTicketCustomerData] = useState({
    firstName: customerData?.firstName || '',
    lastName: customerData?.lastName || '',
    email: customerData?.email || '',
  });

  const handleTicketFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      ticketCustomerData.firstName &&
      ticketCustomerData.lastName &&
      ticketCustomerData.email
    ) {
      // Create minimal customer data for tickets
      const minimalCustomerData: CustomerData = {
        ...ticketCustomerData,
        phone: '',
        street: '',
        city: '',
        postalCode: '',
        country: '',
        customerNotes: '',
      };
      onSubmit(minimalCustomerData);
    }
  };

  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
      <StepIndicator
        currentStep={currentStep}
        onStepClick={onStepNavigation}
        completedSteps={completedSteps}
      />

      {isTicketOnlyCart ? (
        <div className='bg-gray-50 p-6 rounded-lg'>
          <h3 className='font-semibold mb-4'>Customer Information</h3>
          <p className='text-sm text-gray-600 mb-4'>
            Please provide your name and email for ticket delivery.
          </p>
          <form
            onSubmit={handleTicketFormSubmit}
            className='space-y-4 text-sm lg:text-base'
          >
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <div>
                <label
                  htmlFor='firstName'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  First Name *
                </label>
                <input
                  type='text'
                  id='firstName'
                  value={ticketCustomerData.firstName}
                  onChange={(e) =>
                    setTicketCustomerData((prev) => ({
                      ...prev,
                      firstName: e.target.value,
                    }))
                  }
                  className='bg-white w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                  disabled={isProcessing}
                />
              </div>
              <div>
                <label
                  htmlFor='lastName'
                  className='block text-sm font-medium text-gray-700 mb-1'
                >
                  Last Name *
                </label>
                <input
                  type='text'
                  id='lastName'
                  value={ticketCustomerData.lastName}
                  onChange={(e) =>
                    setTicketCustomerData((prev) => ({
                      ...prev,
                      lastName: e.target.value,
                    }))
                  }
                  className='bg-white w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  required
                  disabled={isProcessing}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700 mb-1'
              >
                Email Address *
              </label>
              <input
                type='email'
                id='email'
                value={ticketCustomerData.email}
                onChange={(e) =>
                  setTicketCustomerData((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className='bg-white w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                required
                disabled={isProcessing}
              />
            </div>
            <div className='pt-4'>
              <button
                type='submit'
                disabled={isProcessing}
                className='w-full bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm'
              >
                {isProcessing ? 'Processing...' : 'Continue to Payment'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <CustomerDataForm
          onSubmit={onSubmit}
          isSubmitting={isProcessing}
          initialData={customerData}
        />
      )}
    </div>
  );
};

export default CustomerInfoStep;
