'use client';
import React, { useEffect, useRef, useState, Suspense } from 'react';
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

const STATUS_MESSAGES: Record<PageState, string> = {
  verifying: 'Verifying your payment...',
  processing: 'Processing your order...',
  succeeded: 'Payment successful!',
  failed: 'Payment not completed',
};

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
  const clearCartRef = useRef(clearCart);
  clearCartRef.current = clearCart;

  const paymentIntentId = searchParams.get('payment_intent');
  const redirectStatus = searchParams.get('redirect_status');

  const [pageState, setPageState] = useState<PageState>('verifying');
  const [processingDetail, setProcessingDetail] = useState<string | null>(
    null
  );
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  useEffect(() => {
    let active = true;

    const cleanupFallbackData = () => {
      sessionStorage.removeItem('fallbackOrderData');
    };

    const failPayment = () => {
      if (!active) return;
      cleanupFallbackData();
      setPageState('failed');
      setProcessingDetail(null);
    };

    const completeSuccessfulPayment = async () => {
      if (!active) return;
      setPageState('processing');
      setProcessingDetail(
        'Please wait while we finalize your order and send your confirmation email.'
      );

      // Brief pause to give the webhook a head start before fallback runs.
      await new Promise((resolve) => setTimeout(resolve, 2000));
      if (!active) return;

      if (paymentIntentId) {
        try {
          const fallbackDataStr = sessionStorage.getItem('fallbackOrderData');
          if (fallbackDataStr) {
            if (active) {
              setProcessingDetail('Confirming your order details...');
            }

            const fallbackData = JSON.parse(fallbackDataStr);
            const response = await fetch('/api/ensure-order-created', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(fallbackData),
            });

            if (!active) return;

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

      if (!active) return;
      clearCartRef.current();
      setProcessingDetail(null);
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

      // Stripe redirect-based methods include redirect_status on return.
      if (redirectStatus === 'succeeded') {
        await completeSuccessfulPayment();
        return;
      }

      const initialStatus = await fetchPaymentStatus(paymentIntentId);
      if (!active) return;

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
        if (active) {
          setProcessingDetail(
            'Your bank is still confirming the payment. This usually takes a few seconds.'
          );
        }
        const finalStatus = await waitForPaymentSuccess(paymentIntentId);
        if (!active) return;

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

    return () => {
      active = false;
    };
  }, [paymentIntentId, redirectStatus]);

  if (pageState === 'verifying' || pageState === 'processing') {
    return (
      <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <h1 className='font-bold text-xl'>{STATUS_MESSAGES[pageState]}</h1>
        {processingDetail && (
          <p className='text-gray-600'>{processingDetail}</p>
        )}
      </article>
    );
  }

  if (pageState === 'failed') {
    return (
      <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
        <h1 className='font-bold text-2xl'>{STATUS_MESSAGES.failed}</h1>
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
