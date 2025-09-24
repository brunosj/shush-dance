// pages/success.tsx
import React from 'react';
import Button from '../../_components/Button';

const SuccessPage: React.FC = () => {
  return (
    <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
      <h1 className='font-bold '>Thanks!</h1>
      <p className='pb-3'>
        Your payment was successful and your order summary has been sent to you
        by email.
      </p>

      <div className=''>
        <Button href='/' label='Return to Home' />
      </div>
    </article>
  );
};

export default SuccessPage;
