import React from 'react';
import { FaStripe } from 'react-icons/fa';
import { useShoppingCart } from 'use-shopping-cart';
import { useRouter } from 'next/navigation';

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

const StripeCheckoutButton: React.FC<StripeCheckoutButtonProps> = ({
  customerData,
  orderTotals,
  shippingRegion,
}) => {
  const { redirectToCheckout, clearCart, cartDetails } = useShoppingCart();
  const router = useRouter();

  // Handle Stripe checkout
  const handleStripeCheckout = async () => {
    try {
      const result = await redirectToCheckout();
      if (result?.error) {
        console.error('Error during checkout:', result.error);
      } else {
        // For Stripe, we'll create the order record after successful payment
        // This would typically be handled by a webhook in production
        if (customerData && orderTotals) {
          await createOrderRecord();
        }
        await clearCart();
        router.push('/success');
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  const createOrderRecord = async () => {
    if (!customerData || !orderTotals) return;

    const orderNumber = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const orderData = {
      orderNumber,
      customerData,
      cartItems: Object.entries(cartDetails || {}).map(([key, item]) => ({
        id: key,
        name: item.name,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.price,
        lineTotal: item.price * item.quantity,
      })),
      totals: orderTotals,
      shippingRegion,
      paymentMethod: 'stripe',
      transactionId: `stripe-${orderNumber}`, // Placeholder - would be actual Stripe transaction ID in production
    };

    try {
      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        console.error('Failed to create order record');
      }
    } catch (error) {
      console.error('Error creating order record:', error);
    }
  };

  return (
    <button
      onClick={handleStripeCheckout}
      className='w-full flex items-center justify-center bg-[#2C2E2F] hover:brightness-[1.2] brightness-100 text-white  px-12  shadow-md transition duration-200'
    >
      <FaStripe size={50} />
      {/* <span className='ml-2'>Pay with Stripe</span> */}
    </button>
  );
};

export default StripeCheckoutButton;
