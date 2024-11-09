import React from 'react';
import { FaStripe } from 'react-icons/fa';
import { useShoppingCart } from 'use-shopping-cart';

const StripeCheckoutButton: React.FC = () => {
  const { redirectToCheckout, clearCart } = useShoppingCart();

  // Handle Stripe checkout
  const handleStripeCheckout = async () => {
    try {
      const result = await redirectToCheckout();
      if (result?.error) {
        console.error('Error during checkout:', result.error);
      } else {
        clearCart();
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <button
      onClick={handleStripeCheckout}
      className='flex items-center bg-[#2C2E2F] hover:brightness-[1.2] brightness-100 text-white  px-12 rounded-none  shadow-md  transition duration-200'
    >
      <FaStripe size={40} />
    </button>
  );
};

export default StripeCheckoutButton;
