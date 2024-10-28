// pages/success.tsx
import React from 'react';
import Link from 'next/link';

const SuccessPage: React.FC = () => {
  return (
    <div className='flex flex-col items-center justify-center min-h-screen text-center bg-green-100'>
      <h1 className='text-3xl font-bold text-green-600'>
        Thank You for Your Purchase!
      </h1>
      <p className='mt-4 text-lg text-gray-700'>
        Your payment was successful. A confirmation email has been sent to you.
      </p>
      <div className='mt-6'>
        <Link href='/' className='text-blue-500 hover:underline'>
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default SuccessPage;
