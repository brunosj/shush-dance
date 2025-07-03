import React from 'react';
import { CustomerData } from '../../_providers/CheckoutProvider';

interface ShippingAddressDisplayProps {
  customerData: CustomerData | null;
  onEditCustomerInfo: () => void;
}

const ShippingAddressDisplay: React.FC<ShippingAddressDisplayProps> = ({
  customerData,
  onEditCustomerInfo,
}) => {
  return (
    <div className='bg-gray-50 p-6 rounded-lg'>
      <h4 className=' font-semibold mb-4'>Customer & Shipping Info</h4>
      <div className='text-sm text-gray-700'>
        <p className='font-medium'>
          {customerData?.firstName} {customerData?.lastName}
        </p>
        <p className='text-gray-600'>{customerData?.email}</p>
        <p className='mt-2'>{customerData?.street}</p>
        <p>
          {customerData?.city}, {customerData?.postalCode}
        </p>
        <p>{customerData?.country}</p>
        {customerData?.phone && (
          <p className='mt-2'>Phone: {customerData.phone}</p>
        )}
        {customerData?.customerNotes && (
          <div className='mt-3 pt-3 border-t border-gray-200'>
            <p className='font-medium text-xs text-gray-500 uppercase tracking-wide'>
              Order Notes:
            </p>
            <p className='text-sm'>{customerData.customerNotes}</p>
          </div>
        )}
      </div>

      {/* Edit Customer Info Button */}
      <button
        onClick={onEditCustomerInfo}
        className='mt-4 text-sm text-blue-600 hover:text-blue-800 underline'
      >
        Edit customer information
      </button>
    </div>
  );
};

export default ShippingAddressDisplay;
