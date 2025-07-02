'use client';

import React from 'react';

type CheckoutStep = 'cart' | 'customer-info' | 'payment';

interface StepIndicatorProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  completedSteps?: CheckoutStep[];
}

const steps = [
  { key: 'cart' as CheckoutStep, label: 'Cart', number: 1 },
  { key: 'customer-info' as CheckoutStep, label: 'Customer Info', number: 2 },
  { key: 'payment' as CheckoutStep, label: 'Review Order', number: 3 },
];

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
}) => {
  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  const isStepClickable = (stepKey: CheckoutStep, index: number) => {
    // Can click on completed steps, current step, or cart (always accessible)
    return (
      stepKey === 'cart' ||
      completedSteps.includes(stepKey) ||
      stepKey === currentStep
    );
  };

  const handleStepClick = (stepKey: CheckoutStep, index: number) => {
    if (isStepClickable(stepKey, index) && onStepClick) {
      onStepClick(stepKey);
    }
  };

  return (
    <div className='mb-8'>
      <div className='grid grid-cols-3 gap-4 max-w-md mx-auto'>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = step.key === currentStep;
          const isClickable = isStepClickable(step.key, index);

          return (
            <div
              key={step.key}
              className={`relative flex flex-col items-center ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => handleStepClick(step.key, index)}
            >
              {/* Step Circle */}
              <div
                className={`
                  w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-200
                  ${
                    isCompleted
                      ? 'bg-green-600 text-white'
                      : isCurrent
                        ? 'bg-black text-white'
                        : 'bg-gray-200 text-gray-600'
                  }
                  ${isClickable ? 'hover:scale-110 hover:shadow-lg' : ''}
                `}
              >
                {isCompleted ? '✓' : step.number}
              </div>
              <span
                className={`
                  mt-2 text-xs font-medium text-center transition-colors duration-200
                  ${isCompleted || isCurrent ? 'text-black' : 'text-gray-500'}
                  ${isClickable ? 'hover:text-black' : ''}
                `}
              >
                {step.label}
              </span>

              {/* Connecting Line - positioned absolutely to connect steps */}
              {index < steps.length - 1 && (
                <div
                  className={`
                    absolute top-5 left-full w-4 h-0.5 transform translate-x-2 transition-colors duration-200
                    ${isCompleted ? 'bg-green-600' : index < currentStepIndex ? 'bg-black' : 'bg-gray-200'}
                  `}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StepIndicator;
