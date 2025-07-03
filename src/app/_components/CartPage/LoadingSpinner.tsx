import React from 'react';

const LoadingSpinner: React.FC<{ message?: string }> = ({
  message = 'Processing...',
}) => {
  return (
    <div className='max-w-3xl mx-2 md:mx-auto mt-24 mb-12 text-center'>
      <div className='flex flex-col items-center justify-center min-h-[300px] space-y-6'>
        <div className='animate-spin rounded-full h-16 w-16 border-b-2 border-black'></div>
        <h2 className='text-xl font-semibold'>{message}</h2>
        {/* <p className='text-gray-600'>Please don't close this page...</p> */}
      </div>
    </div>
  );
};

export default LoadingSpinner;
