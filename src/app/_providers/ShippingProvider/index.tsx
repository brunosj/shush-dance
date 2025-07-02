'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { ShippingRegion, SHIPPING_LOCATIONS } from '../../_types/shipping';

interface ShippingContextType {
  selectedRegion: ShippingRegion;
  setSelectedRegion: (region: ShippingRegion) => void;
  getVATRate: () => number;
  getRegionLabel: () => string;
}

const ShippingContext = createContext<ShippingContextType | undefined>(
  undefined
);

export function ShippingProvider({ children }: { children: React.ReactNode }) {
  const [selectedRegion, setSelectedRegion] = useState<ShippingRegion>('eu');

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('shippingRegion');
    if (saved && ['germany', 'eu', 'restOfWorld'].includes(saved)) {
      setSelectedRegion(saved as ShippingRegion);
    }
  }, []);

  // Save to localStorage when region changes
  useEffect(() => {
    localStorage.setItem('shippingRegion', selectedRegion);
  }, [selectedRegion]);

  const getVATRate = () => {
    const location = SHIPPING_LOCATIONS.find(
      (loc) => loc.region === selectedRegion
    );
    return location?.vatRate || 0;
  };

  const getRegionLabel = () => {
    const location = SHIPPING_LOCATIONS.find(
      (loc) => loc.region === selectedRegion
    );
    return location?.label || 'Unknown';
  };

  return (
    <ShippingContext.Provider
      value={{
        selectedRegion,
        setSelectedRegion,
        getVATRate,
        getRegionLabel,
      }}
    >
      {children}
    </ShippingContext.Provider>
  );
}

export function useShipping() {
  const context = useContext(ShippingContext);
  if (context === undefined) {
    throw new Error('useShipping must be used within a ShippingProvider');
  }
  return context;
}
