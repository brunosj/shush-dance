'use client';

import React, { useMemo } from 'react';
import type { CheckoutStep } from '../../../utilities/checkoutSteps';

interface StepIndicatorProps {
  currentStep: CheckoutStep;
  onStepClick?: (step: CheckoutStep) => void;
  completedSteps?: CheckoutStep[];
  includeTicketDetails?: boolean;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({
  currentStep,
  onStepClick,
  completedSteps = [],
  includeTicketDetails = false,
}) => {
  const steps = useMemo(() => {
    const base: { key: CheckoutStep; label: string; number: number }[] = [
      { key: 'cart', label: 'Cart', number: 1 },
      { key: 'customer-info', label: 'Customer Info', number: 2 },
    ];
    if (includeTicketDetails) {
      base.push({
        key: 'ticket-details',
        label: 'Ticket Details',
        number: 3,
      });
    }
    base.push({
      key: 'payment',
      label: 'Review Order',
      number: includeTicketDetails ? 4 : 3,
    });
    return base;
  }, [includeTicketDetails]);

  const getCurrentStepIndex = () => {
    return steps.findIndex((step) => step.key === currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();

  const isStepClickable = (stepKey: CheckoutStep) => {
    return (
      stepKey === 'cart' ||
      completedSteps.includes(stepKey) ||
      stepKey === currentStep
    );
  };

  const handleStepClick = (stepKey: CheckoutStep) => {
    if (isStepClickable(stepKey) && onStepClick) {
      onStepClick(stepKey);
    }
  };

  const gridCols = includeTicketDetails ? 'grid-cols-4' : 'grid-cols-3';

  return (
    <div className='mb-8'>
      <div className={`grid ${gridCols} gap-4 max-w-2xl mx-auto`}>
        {steps.map((step, index) => {
          const isCompleted = completedSteps.includes(step.key);
          const isCurrent = step.key === currentStep;
          const isClickable = isStepClickable(step.key);

          return (
            <div
              key={step.key}
              className={`relative flex flex-col items-center ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
              onClick={() => handleStepClick(step.key)}
            >
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
