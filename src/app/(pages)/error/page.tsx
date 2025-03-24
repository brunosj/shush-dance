// pages/success.tsx
import React from 'react';
import Button from '../../_components/Button';

const ErrorPage: React.FC = () => {
  return (
    <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
      <h1 className='font-bold '></h1>
      <p className=''>The payment was not successful. Please try again.</p>
      <div className=''>
        <Button href='/cart' label='Return to Cart' />
      </div>
    </article>
  );
};

export default ErrorPage;
