'use client';
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useShoppingCart } from 'use-shopping-cart';
import Button from '../../_components/Button';

type PageState = 'verifying' | 'processing' | 'succeeded' | 'failed';

const TERMINAL_FAILURE_STATUSES = new Set([
  'requires_payment_method',
  'canceled',
]);

const IN_PROGRESS_STATUSES = new Set([
  'processing',
  'requires_action',
  'requires_capture',
  'requires_confirmation',
]);

async function fetchPaymentStatus(
  paymentIntentId: string
): Promise<{ status: string; succeeded: boolean } | null> {
  try {
    const response = await fetch(
      `/api/payment-status?payment_intent=${encodeURIComponent(paymentIntentId)}`
    );
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

async function waitForPaymentSuccess(
  paymentIntentId: string,
  maxAttempts = 15,
  intervalMs = 2000
): Promise<{ status: string; succeeded: boolean } | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const result = await fetchPaymentStatus(paymentIntentId);
    if (!result) return null;

    if (result.succeeded) return result;
    if (TERMINAL_FAILURE_STATUSES.has(result.status)) return result;

    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, intervalMs));
    } else {
      return result;
    }
  }
  return null;
}

const SuccessPageContent: React.FC = () => {
  const searchParams = useSearchParams();
  const { clearCart } = useShoppingCart();
  const [pageState, setPageState] = useState<PageState>('verifying');
  const [processingMessage, setProcessingMessage] = useState(
    'Verifying your payment...'
  );
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  useEffect(() => {
    const paymentIntentId = searchParams.get('payment_intent');
    const redirectStatus = searchParams.get('redirect_status');

    const cleanupFallbackData = () => {
      sessionStorage.removeItem('fallbackOrderData');
    };

    const failPayment = () => {
      cleanupFallbackData();
      setPageState('failed');
    };

    const completeSuccessfulPayment = async () => {
      setPageState('processing');

      const messages = [
        'Processing your order...',
        'Creating order records...',
        'Sending confirmation email...',
        'Finalizing your purchase...',
      ];

      let messageIndex = 0;
      const messageInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        setProcessingMessage(messages[messageIndex]);
      }, 800);

      await new Promise((resolve) => setTimeout(resolve, 4000));

      if (paymentIntentId) {
        try {
          const fallbackDataStr = sessionStorage.getItem('fallbackOrderData');
          if (fallbackDataStr) {
            const fallbackData = JSON.parse(fallbackDataStr);
            setProcessingMessage('Ensuring order completion...');

            const response = await fetch('/api/ensure-order-created', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fallbackData),
            });

            if (response.ok) {
              const result = await response.json();
              if (!result.webhookWorked) {
                setFallbackTriggered(true);
              }
            }

            cleanupFallbackData();
          }
        } catch (error) {
          console.error('❌ Fallback mechanism failed:', error);
        }
      }

      clearInterval(messageInterval);
      clearCart();
      setPageState('succeeded');
    };

    const verifyPayment = async () => {
      if (redirectStatus === 'failed') {
        failPayment();
        return;
      }

      if (!paymentIntentId) {
        failPayment();
        return;
      }

      const initialStatus = await fetchPaymentStatus(paymentIntentId);
      if (!initialStatus) {
        failPayment();
        return;
      }

      if (initialStatus.succeeded) {
        await completeSuccessfulPayment();
        return;
      }

      if (TERMINAL_FAILURE_STATUSES.has(initialStatus.status)) {
        failPayment();
        return;
      }

      if (IN_PROGRESS_STATUSES.has(initialStatus.status)) {
        setProcessingMessage('Waiting for payment confirmation...');
        const finalStatus = await waitForPaymentSuccess(paymentIntentId);

        if (!finalStatus || !finalStatus.succeeded) {
          failPayment();
          return;
        }

        await completeSuccessfulPayment();
        return;
      }

      failPayment();
    };

    verifyPayment();
  }, [searchParams, clearCart]);

  if (pageState === 'verifying' || pageState === 'processing') {
    return (
      <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <h1 className='font-bold text-xl'>{processingMessage}</h1>
        <p className='text-gray-600'>
          {pageState === 'verifying'
            ? 'Please wait while we confirm your payment status.'
            : 'Please wait while we finalize your payment and send your confirmation email.'}
        </p>
      </article>
    );
  }

  if (pageState === 'failed') {
    return (
      <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
        <h1 className='font-bold text-2xl'>Payment not completed</h1>
        <p className='pb-3 text-lg'>
          Your payment was not completed. No charge was made and no order was
          created.
        </p>
        <div className='pt-4'>
          <Button href='/cart' label='Return to Cart' />
        </div>
      </article>
    );
  }

  return (
    <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
      <h1 className='font-bold text-2xl'>Payment Successful!</h1>
      <p className='pb-3 text-lg'>
        Your payment was processed successfully. Your order confirmation{' '}
        {fallbackTriggered ? 'has been' : 'will be'} sent to your email
        {fallbackTriggered ? '' : ' shortly'}.
      </p>
      <p className='text-sm text-gray-600'>
        If you don't receive a confirmation email, please check your spam folder
        or contact us at hello@shush.dance. If you bought tickets, please note
        that your name will be added to a list at the door.
      </p>
      <div className='pt-4'>
        <Button href='/' label='Return to Home' />
      </div>
    </article>
  );
};

const SuccessPage: React.FC = () => {
  return (
    <Suspense
      fallback={
        <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
          <h1 className='font-bold text-xl'>Loading...</h1>
        </article>
      }
    >
      <SuccessPageContent />
    </Suspense>
  );
};

export const dynamic = 'force-dynamic';

export default SuccessPage;
