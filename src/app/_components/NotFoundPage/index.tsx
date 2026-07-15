'use client';

import { useEffect } from 'react';
import Button from '../Button';

const NotFoundPage = () => {
  useEffect(() => {
    console.info('[SHUSH] Page not found', {
      code: 404,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, []);

  return (
    <article className='container layout flex min-h-[60vh] flex-col items-center justify-center text-center'>
      <p className='text-xs uppercase tracking-[0.35em] text-darkGray'>
        Error 404
      </p>
      <h1 className='mt-6 text-4xl font-bold lg:text-6xl'>Page not found</h1>
      <p className='mt-6 max-w-md text-darkGray'>
        This page doesn&apos;t exist or may have moved. Check the URL, or head
        back to the homepage.
      </p>
      <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
        <Button href='/' label='Return to Home' />
        <Button href='/events' label='View Events' textStyles='text-sm' />
      </div>
    </article>
  );
};

export default NotFoundPage;
