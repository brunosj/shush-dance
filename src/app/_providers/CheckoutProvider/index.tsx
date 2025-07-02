'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface CustomerData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  postalCode: string;
  country: string;
  customerNotes: string;
}

interface CheckoutContextType {
  customerData: CustomerData | null;
  setCustomerData: (data: CustomerData | null) => void;
  clearCustomerData: () => void;
  hasCustomerData: () => boolean;
}

const CheckoutContext = createContext<CheckoutContextType | undefined>(
  undefined
);

const defaultCustomerData: CustomerData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  street: '',
  city: '',
  postalCode: '',
  country: '',
  customerNotes: '',
};

export function CheckoutProvider({ children }: { children: React.ReactNode }) {
  const [customerData, setCustomerDataState] = useState<CustomerData | null>(
    null
  );

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('checkoutCustomerData');
    if (saved) {
      try {
        const parsedData = JSON.parse(saved);
        // Validate that it has the required structure
        if (
          parsedData &&
          typeof parsedData === 'object' &&
          parsedData.firstName !== undefined
        ) {
          setCustomerDataState(parsedData);
        }
      } catch (error) {
        console.error('Error parsing saved customer data:', error);
        localStorage.removeItem('checkoutCustomerData');
      }
    }
  }, []);

  // Save to localStorage when customer data changes
  useEffect(() => {
    if (customerData) {
      localStorage.setItem(
        'checkoutCustomerData',
        JSON.stringify(customerData)
      );
    } else {
      localStorage.removeItem('checkoutCustomerData');
    }
  }, [customerData]);

  const setCustomerData = (data: CustomerData | null) => {
    setCustomerDataState(data);
  };

  const clearCustomerData = () => {
    setCustomerDataState(null);
    localStorage.removeItem('checkoutCustomerData');
  };

  const hasCustomerData = () => {
    return (
      customerData !== null &&
      customerData.firstName !== '' &&
      customerData.email !== ''
    );
  };

  return (
    <CheckoutContext.Provider
      value={{
        customerData,
        setCustomerData,
        clearCustomerData,
        hasCustomerData,
      }}
    >
      {children}
    </CheckoutContext.Provider>
  );
}

export function useCheckout() {
  const context = useContext(CheckoutContext);
  if (context === undefined) {
    throw new Error('useCheckout must be used within a CheckoutProvider');
  }
  return context;
}
