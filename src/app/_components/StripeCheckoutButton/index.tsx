import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useShoppingCart } from 'use-shopping-cart';
import { useRouter } from 'next/navigation';

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

interface StripeCheckoutButtonProps {
  customerData?: any;
  orderTotals?: {
    subtotal: number;
    shipping: number;
    vat: number;
    total: number;
  };
  shippingRegion?: string;
}

// Payment form component that uses Stripe Elements
const CheckoutForm: React.FC<{
  customerData: any;
  orderTotals: any;
  shippingRegion: string;
  onSuccess: () => void;
  onError: (error: string) => void;
}> = ({ customerData, orderTotals, shippingRegion, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const { clearCart, cartDetails } = useShoppingCart();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);

    try {
      const { error: submitError } = await elements.submit();
      if (submitError) {
        onError(submitError.message || 'Payment failed');
        setIsLoading(false);
        return;
      }

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/success`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        // Payment succeeded - create order and sales records
        await createOrderAndSalesRecords();
        await clearCart();
        onSuccess();
      }
    } catch (err: any) {
      onError(err.message || 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const createOrderAndSalesRecords = async () => {
    // Create order record
    const orderNumber = `SHUSH-ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const transactionId = `SHUSH-stripe-${orderNumber}`;

    const orderData = {
      orderNumber,
      customerData,
      cartItems: Object.entries(cartDetails || {}).map(([key, item]) => {
        const productData = item?.product_data as any;
        const metadata = productData?.metadata || {};

        return {
          id: key,
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.price,
          lineTotal: item.price * item.quantity,
          type: metadata.type || 'merch',
          metadata: metadata,
          parentItem: item.parentItem || null, // For tickets, this contains the event title
          stripePriceId: item.id.includes('price_') ? item.id : null, // Extract Stripe price ID if present
        };
      }),
      totals: orderTotals,
      shippingRegion,
      paymentMethod: 'stripe',
      transactionId,
    };

    try {
      await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData),
      });
      // Note: Sales records are now created automatically by the create-order endpoint
    } catch (error) {
      console.error('Error creating order/sales records:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-6'>
      <PaymentElement />
      <button
        disabled={isLoading || !stripe || !elements}
        className='w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-3 px-4 rounded-lg transition-colors'
      >
        {isLoading ? 'Processing...' : `Pay €${orderTotals.total.toFixed(2)}`}
      </button>
    </form>
  );
};

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  customerData,
  orderTotals,
  shippingRegion,
}) => {
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const abortControllerRef = React.useRef<AbortController | null>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Validate all required data is present
    if (!orderTotals || !customerData) {
      console.log('StripeCheckoutButton: Missing required data', {
        hasOrderTotals: !!orderTotals,
        hasCustomerData: !!customerData,
      });
      return;
    }

    // Validate orderTotals structure
    if (typeof orderTotals.total !== 'number' || orderTotals.total <= 0) {
      console.error('StripeCheckoutButton: Invalid order total', orderTotals);
      setError('Invalid order total');
      setIsLoading(false);
      return;
    }

    // Validate customerData structure
    if (!customerData.email || !customerData.firstName) {
      console.error('StripeCheckoutButton: Invalid customer data', {
        hasEmail: !!customerData.email,
        hasFirstName: !!customerData.firstName,
      });
      setError('Invalid customer information');
      setIsLoading(false);
      return;
    }

    const createPaymentIntent = async (retryCount = 0) => {
      const maxRetries = 3;
      const retryDelay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        console.log(
          `StripeCheckoutButton: Creating payment intent (attempt ${retryCount + 1}/${maxRetries + 1})`
        );

        const response = await fetch('/api/create-payment-intent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: orderTotals.total,
            currency: 'eur',
            customerData,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(
            'Payment intent API error:',
            response.status,
            errorText
          );

          // Retry on 502, 503, 504 errors (server errors)
          if (
            (response.status === 502 ||
              response.status === 503 ||
              response.status === 504) &&
            retryCount < maxRetries
          ) {
            console.log(
              `Retrying payment intent creation in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`
            );
            timeoutRef.current = setTimeout(
              () => createPaymentIntent(retryCount + 1),
              retryDelay
            );
            return;
          }

          throw new Error(
            `API responded with ${response.status}: ${errorText}`
          );
        }

        const data = await response.json();

        if (data.error) {
          setError(data.error);
        } else if (data.clientSecret) {
          setClientSecret(data.clientSecret);
          setError(''); // Clear any previous errors
        } else {
          setError('No client secret received');
        }
      } catch (err: any) {
        // Don't show errors if the request was aborted (component unmounted)
        if (err.name === 'AbortError') {
          console.log('StripeCheckoutButton: Payment intent request aborted');
          return;
        }

        console.error('Payment intent creation failed:', err);

        // Retry on network errors
        if (
          retryCount < maxRetries &&
          (err.name === 'TypeError' || err.message.includes('fetch'))
        ) {
          console.log(
            `Retrying payment intent creation in ${retryDelay}ms (attempt ${retryCount + 1}/${maxRetries})`
          );
          timeoutRef.current = setTimeout(
            () => createPaymentIntent(retryCount + 1),
            retryDelay
          );
          return;
        }

        setError(err.message || 'Failed to initialize payment');
      } finally {
        // Only set loading to false if this isn't a retry attempt
        if (retryCount === 0 || retryCount === maxRetries) {
          setIsLoading(false);
        }
      }
    };

    // Add a small delay to ensure component is fully mounted and data is stable
    timeoutRef.current = setTimeout(() => createPaymentIntent(), 100);

    // Cleanup function to cancel requests when component unmounts or dependencies change
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [orderTotals, customerData]);

  const handleSuccess = () => {
    router.push('/success');
  };

  const handleError = (errorMessage: string) => {
    setError(errorMessage);
    console.error('Payment error:', errorMessage);
  };

  if (isLoading) {
    return (
      <div className='text-center py-8'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto'></div>
        <p className='mt-2 text-gray-600'>Preparing payment...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-red-600 mb-4'>{error}</p>
        <button
          onClick={() => window.location.reload()}
          className='text-blue-600 hover:text-blue-800 underline'
        >
          Try again
        </button>
      </div>
    );
  }

  if (!clientSecret) {
    return (
      <div className='text-center py-8'>
        <p className='text-gray-600'>Unable to initialize payment</p>
      </div>
    );
  }

  const options = {
    clientSecret,
    appearance: {
      theme: 'stripe' as const,
    },
  };

  return (
    <Elements options={options} stripe={stripePromise}>
      <CheckoutForm
        customerData={customerData}
        orderTotals={orderTotals}
        shippingRegion={shippingRegion || 'eu'}
        onSuccess={handleSuccess}
        onError={handleError}
      />
    </Elements>
  );
};

export default StripeCheckoutButton;
