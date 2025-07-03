import React from 'react';
import StripeCheckoutButton from '../StripeCheckoutButton';
import { CustomerData } from '../../_providers/CheckoutProvider';
import { type ShippingRegion } from '../../_types/shipping';

interface PaymentSectionProps {
  customerData: CustomerData | null;
  orderTotals: {
    subtotal: number;
    shipping: number;
    vat: number;
    total: number;
  };
  shippingRegion: ShippingRegion;
}

const PaymentSection: React.FC<PaymentSectionProps> = ({
  customerData,
  orderTotals,
  shippingRegion,
}) => {
  return (
    <div className='bg-gray-50 p-6 rounded-lg'>
      <h4 className=' font-semibold mb-4'>Payment Information</h4>
      <p className='text-sm text-gray-600 mb-6'>
        Complete your payment securely with Stripe. PayPal users can select
        PayPal as a payment method within Stripe.
      </p>

      <StripeCheckoutButton
        customerData={customerData}
        orderTotals={orderTotals}
        shippingRegion={shippingRegion}
      />
    </div>
  );
};

export default PaymentSection;
