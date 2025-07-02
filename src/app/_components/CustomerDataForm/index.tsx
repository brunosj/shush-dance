'use client';

import React, { useState } from 'react';
import { useShipping } from '../../_providers/ShippingProvider';

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

interface CustomerDataFormProps {
  onSubmit: (data: CustomerData) => void;
  isSubmitting?: boolean;
  initialData?: CustomerData | null;
}

const CustomerDataForm: React.FC<CustomerDataFormProps> = ({
  onSubmit,
  isSubmitting = false,
  initialData = null,
}) => {
  const { selectedRegion, getRegionLabel } = useShipping();

  const [formData, setFormData] = useState<CustomerData>({
    firstName: initialData?.firstName || '',
    lastName: initialData?.lastName || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    street: initialData?.street || '',
    city: initialData?.city || '',
    postalCode: initialData?.postalCode || '',
    country: initialData?.country || '',
    customerNotes: initialData?.customerNotes || '',
  });

  const [errors, setErrors] = useState<Partial<CustomerData>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<CustomerData> = {};

    if (!formData.firstName.trim())
      newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.street.trim())
      newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    if (!formData.postalCode.trim())
      newErrors.postalCode = 'Postal code is required';
    if (!formData.country.trim()) newErrors.country = 'Country is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof CustomerData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <div className='bg-gray-50 p-6 rounded-lg'>
      <h3 className='text-lg font-semibold mb-4'>Customer Information</h3>
      <p className='text-sm text-gray-600 mb-4'>
        Shipping to: <strong>{getRegionLabel()}</strong>
      </p>

      <form onSubmit={handleSubmit} className='space-y-4'>
        {/* Name Fields */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='firstName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              First Name *
            </label>
            <input
              type='text'
              id='firstName'
              name='firstName'
              value={formData.firstName}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-md ${
                errors.firstName ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.firstName && (
              <p className='text-red-500 text-xs mt-1'>{errors.firstName}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='lastName'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Last Name *
            </label>
            <input
              type='text'
              id='lastName'
              name='lastName'
              value={formData.lastName}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-md ${
                errors.lastName ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.lastName && (
              <p className='text-red-500 text-xs mt-1'>{errors.lastName}</p>
            )}
          </div>
        </div>

        {/* Contact Fields */}
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email Address *
            </label>
            <input
              type='email'
              id='email'
              name='email'
              value={formData.email}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-md ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.email && (
              <p className='text-red-500 text-xs mt-1'>{errors.email}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='phone'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Phone Number
            </label>
            <input
              type='tel'
              id='phone'
              name='phone'
              value={formData.phone}
              onChange={handleInputChange}
              className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
              disabled={isSubmitting}
            />
          </div>
        </div>

        {/* Address Fields */}
        <div>
          <label
            htmlFor='street'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Street Address *
          </label>
          <input
            type='text'
            id='street'
            name='street'
            value={formData.street}
            onChange={handleInputChange}
            className={`w-full p-3 border rounded-md ${
              errors.street ? 'border-red-500' : 'border-gray-300'
            } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
            disabled={isSubmitting}
          />
          {errors.street && (
            <p className='text-red-500 text-xs mt-1'>{errors.street}</p>
          )}
        </div>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div>
            <label
              htmlFor='city'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              City *
            </label>
            <input
              type='text'
              id='city'
              name='city'
              value={formData.city}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-md ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.city && (
              <p className='text-red-500 text-xs mt-1'>{errors.city}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='postalCode'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Postal Code *
            </label>
            <input
              type='text'
              id='postalCode'
              name='postalCode'
              value={formData.postalCode}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-md ${
                errors.postalCode ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.postalCode && (
              <p className='text-red-500 text-xs mt-1'>{errors.postalCode}</p>
            )}
          </div>

          <div>
            <label
              htmlFor='country'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Country *
            </label>
            <input
              type='text'
              id='country'
              name='country'
              value={formData.country}
              onChange={handleInputChange}
              className={`w-full p-3 border rounded-md ${
                errors.country ? 'border-red-500' : 'border-gray-300'
              } focus:ring-2 focus:ring-blue-500 focus:border-transparent`}
              disabled={isSubmitting}
            />
            {errors.country && (
              <p className='text-red-500 text-xs mt-1'>{errors.country}</p>
            )}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor='customerNotes'
            className='block text-sm font-medium text-gray-700 mb-1'
          >
            Order Notes (Optional)
          </label>
          <textarea
            id='customerNotes'
            name='customerNotes'
            value={formData.customerNotes}
            onChange={handleInputChange}
            rows={3}
            className='w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent'
            placeholder='Any special instructions or notes for your order...'
            disabled={isSubmitting}
          />
        </div>

        <div className='pt-4'>
          <button
            type='submit'
            disabled={isSubmitting}
            className='w-full bg-black text-white py-3 px-6 rounded-md hover:bg-gray-800 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          >
            {isSubmitting ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default CustomerDataForm;
