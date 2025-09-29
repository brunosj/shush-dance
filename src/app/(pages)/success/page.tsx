'use client';
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useShoppingCart } from 'use-shopping-cart';
import Button from '../../_components/Button';

const SuccessPage: React.FC = () => {
  const searchParams = useSearchParams();
  const { clearCart } = useShoppingCart();
  const [showProcessing, setShowProcessing] = useState(true);
  const [processingMessage, setProcessingMessage] = useState(
    'Processing your order...'
  );
  const [fallbackTriggered, setFallbackTriggered] = useState(false);

  useEffect(() => {
    console.log('🎯 Success page loaded, starting processing timer...');

    const paymentIntentId = searchParams.get('payment_intent');

    // Show different messages during processing to make it feel dynamic
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
      console.log(`💬 Message updated: ${messages[messageIndex]}`);
    }, 800);

    // Primary: Give webhook 4 seconds to process
    const webhookTimer = setTimeout(async () => {
      console.log('⏰ Primary webhook timer completed, checking fallback...');

      // If we have payment intent ID, try fallback mechanism
      if (paymentIntentId) {
        try {
          const fallbackDataStr = sessionStorage.getItem('fallbackOrderData');
          if (fallbackDataStr) {
            const fallbackData = JSON.parse(fallbackDataStr);

            console.log('🔄 Attempting fallback order creation...');
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
              console.log('✅ Fallback check completed:', result);

              if (!result.webhookWorked) {
                setFallbackTriggered(true);
                console.log('⚠️ Webhook failed, fallback order created');
              } else {
                console.log('✅ Webhook worked correctly');
              }
            }

            // Clean up session storage
            sessionStorage.removeItem('fallbackOrderData');
          }
        } catch (error) {
          console.error('❌ Fallback mechanism failed:', error);
        }
      }

      clearInterval(messageInterval);
      clearCart(); // Clear cart after processing is complete
      setShowProcessing(false);
    }, 4000); // 4 seconds - enough time for webhook + fallback check

    return () => {
      console.log('🧹 Cleaning up timers...');
      clearTimeout(webhookTimer);
      clearInterval(messageInterval);
    };
  }, []); // Empty dependency array - only run once on mount

  if (showProcessing) {
    console.log(`🔄 Showing processing state: ${processingMessage}`);
    return (
      <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto'></div>
        <h1 className='font-bold text-xl'>{processingMessage}</h1>
        <p className='text-gray-600'>
          Please wait while we finalize your payment and send your confirmation
          email.
        </p>
      </article>
    );
  }

  console.log('✅ Showing success state');
  return (
    <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
      {/* <div className='text-green-600 text-6xl mb-4'>✅</div> */}
      <h1 className='font-bold text-2xl'>Payment Successful!</h1>
      <p className='pb-3 text-lg'>
        Your payment was processed successfully. Your order confirmation{' '}
        {fallbackTriggered ? 'has been' : 'will be'} sent to your email
        {fallbackTriggered ? '' : ' shortly'}.
      </p>
      {fallbackTriggered && (
        <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-sm text-yellow-800'>
          <p className='font-medium'>Backup System Activated</p>
          <p>
            Our backup system ensured your order was processed successfully.
          </p>
        </div>
      )}
      <p className='text-sm text-gray-600'>
        If you don't receive a confirmation email, please check your spam folder
        or contact us at hello@shush.dance.
      </p>
      <div className='pt-4'>
        <Button href='/' label='Return to Home' />
      </div>
    </article>
  );
};

export default SuccessPage;
