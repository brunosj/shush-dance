// pages/success.tsx
import React from 'react';
import Button from '../../_components/Button';

const SuccessPage: React.FC = () => {
  return (
    <article className='mx-auto max-w-2xl flex flex-col items-center justify-center min-h-screen text-center space-y-6'>
      <h1 className='font-bold '>Thank You for Your Purchase!</h1>
      <p className=''>
        Your payment was successful and a receipt has been sent to you.
      </p>
      <p className=''>
        If you bought tickets for an event, please note that no actual ticket is
        issued by email. The payment receipt acts as proof of purchase and your
        name will be added to a list at the door.
      </p>
      <div className=''>
        <Button href='/' label='return to home' />
      </div>
    </article>
  );
};

export default SuccessPage;
