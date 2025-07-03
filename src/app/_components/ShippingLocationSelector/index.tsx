'use client';

import React from 'react';
import { useShipping } from '../../_providers/ShippingProvider';
import { SHIPPING_LOCATIONS } from '../../_types/shipping';

const ShippingLocationSelector: React.FC = () => {
  const { selectedRegion, setSelectedRegion, getVATRate } = useShipping();

  return (
    <div className='space-y-3'>
      <h4 className='font-semibold'>Shipping Location</h4>
      <select
        value={selectedRegion}
        onChange={(e) => setSelectedRegion(e.target.value as any)}
        className='w-full p-2 border border-gray-300 rounded-md bg-white text-sm lg:text-base'
      >
        {SHIPPING_LOCATIONS.map((location) => (
          <option key={location.region} value={location.region}>
            {location.label}
          </option>
        ))}
      </select>
      {getVATRate() > 0 && (
        <p className='text-xs text-gray-600'>
          VAT will be added to your order ({(getVATRate() * 100).toFixed(0)}%)
        </p>
      )}
    </div>
  );
};

export default ShippingLocationSelector;
