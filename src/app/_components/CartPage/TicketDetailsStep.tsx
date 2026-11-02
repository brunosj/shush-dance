'use client';

import React from 'react';
import StepIndicator from '../StepIndicator';
import type { CheckoutStep } from '../../../utilities/checkoutSteps';
import { getCartLineBuyerQuestions } from '../../../utilities/buyerQuestions';
import { useCheckout } from '../../_providers/CheckoutProvider';

interface TicketDetailsStepProps {
  currentStep: CheckoutStep;
  completedSteps: CheckoutStep[];
  onStepNavigation: (step: CheckoutStep) => void;
  cartDetails: Record<string, any>;
  onSubmit: () => void;
  isProcessing: boolean;
  includeTicketDetailsStep: boolean;
}

const TicketDetailsStep: React.FC<TicketDetailsStepProps> = ({
  currentStep,
  completedSteps,
  onStepNavigation,
  cartDetails,
  onSubmit,
  isProcessing,
  includeTicketDetailsStep,
}) => {
  const {
    ticketBuyerAnswers,
    updateTicketBuyerAnswer,
    buyerQuestionDefsByLine,
  } = useCheckout();

  const getAnswerValue = (
    lineId: string,
    unitIndex: number,
    key: string
  ): string => {
    const set = ticketBuyerAnswers[lineId]?.[unitIndex] || [];
    return set.find((e) => e.key === key)?.value || '';
  };

  const lines = Object.entries(cartDetails || {}).filter(([lineId, item]) => {
    const metadata = item?.product_data?.metadata || {};
    return getCartLineBuyerQuestions(metadata, lineId, buyerQuestionDefsByLine)
      .length > 0;
  });

  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12'>
      <StepIndicator
        currentStep={currentStep}
        onStepClick={onStepNavigation}
        completedSteps={completedSteps}
        includeTicketDetails={includeTicketDetailsStep}
      />

      <div className='bg-gray-50 p-6 rounded-lg space-y-8'>
        <div>
          <h3 className='font-semibold mb-2'>Ticket details</h3>
          <p className='text-sm text-gray-600'>
            Please answer for each ticket. Required fields are marked with *.
          </p>
        </div>

        {lines.map(([lineId, item]) => {
          const metadata = item?.product_data?.metadata || {};
          const questions = getCartLineBuyerQuestions(
            metadata,
            lineId,
            buyerQuestionDefsByLine
          );
          const tierLabel = item?.name || 'Ticket';
          const parent = item?.parentItem ? ` — ${item.parentItem}` : '';
          const qty = item?.quantity || 1;

          return (
            <div key={lineId} className='border border-gray-200 rounded-lg p-4 bg-white'>
              <h4 className='font-medium text-gray-900 mb-4'>
                {tierLabel}
                {parent}
              </h4>

              <div className='space-y-6'>
                {Array.from({ length: qty }, (_, unitIndex) => (
                  <div
                    key={`${lineId}-${unitIndex}`}
                    className='border-t border-gray-100 pt-4 first:border-0 first:pt-0'
                  >
                    <p className='text-xs font-semibold uppercase tracking-wide text-gray-500 mb-3'>
                      Ticket {unitIndex + 1} of {qty}
                    </p>
                    <div className='space-y-4'>
                      {questions.map((q) => (
                        <div key={q.key}>
                          <label className='block text-sm font-medium text-gray-700 mb-1'>
                            {q.label}
                            {q.required !== false ? ' *' : ''}
                          </label>
                          {q.helpText ? (
                            <p className='text-xs text-gray-500 mb-1'>
                              {q.helpText}
                            </p>
                          ) : null}
                          {q.type === 'select' ? (
                            <select
                              className='bg-white w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                              required={q.required !== false}
                              value={getAnswerValue(lineId, unitIndex, q.key)}
                              onChange={(e) =>
                                updateTicketBuyerAnswer(
                                  lineId,
                                  unitIndex,
                                  q.key,
                                  q.label,
                                  e.target.value
                                )
                              }
                              disabled={isProcessing}
                            >
                              <option value=''>Select…</option>
                              {(q.options || []).map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                  {opt.value}
                                </option>
                              ))}
                            </select>
                          ) : q.type === 'textarea' ? (
                            <textarea
                              className='bg-white w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 min-h-[80px]'
                              required={q.required !== false}
                              value={getAnswerValue(lineId, unitIndex, q.key)}
                              onChange={(e) =>
                                updateTicketBuyerAnswer(
                                  lineId,
                                  unitIndex,
                                  q.key,
                                  q.label,
                                  e.target.value
                                )
                              }
                              disabled={isProcessing}
                            />
                          ) : (
                            <input
                              type='text'
                              className='bg-white w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500'
                              required={q.required !== false}
                              value={getAnswerValue(lineId, unitIndex, q.key)}
                              onChange={(e) =>
                                updateTicketBuyerAnswer(
                                  lineId,
                                  unitIndex,
                                  q.key,
                                  q.label,
                                  e.target.value
                                )
                              }
                              disabled={isProcessing}
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        <button
          type='button'
          onClick={onSubmit}
          disabled={isProcessing}
          className='w-full bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 disabled:opacity-50'
        >
          {isProcessing ? 'Processing…' : 'Continue to payment'}
        </button>
      </div>
    </div>
  );
};

export default TicketDetailsStep;
