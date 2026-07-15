'use client';

import { useEffect } from 'react';
import Button from '../Button';
import { isPayloadFetchError } from '../../_utilities/payloadFetchError';

interface SiteErrorPageProps {
  error: Error & { digest?: string };
  reset?: () => void;
}

const SiteErrorPage = ({ error, reset }: SiteErrorPageProps) => {
  const status = isPayloadFetchError(error) ? error.status : undefined;
  const isTemporary = status === 429 || status === 502 || status === 503;

  useEffect(() => {
    console.error('[SHUSH] Page error', {
      code: status ?? 500,
      name: error.name,
      message: error.message,
      digest: error.digest,
      slug: isPayloadFetchError(error) ? error.slug : undefined,
      context: isPayloadFetchError(error) ? error.context : undefined,
      path: window.location.pathname,
      timestamp: new Date().toISOString(),
    });
  }, [error, status]);

  return (
    <article className='container layout flex min-h-[60vh] flex-col items-center justify-center text-center'>
      <p className='text-xs uppercase tracking-[0.35em] text-darkGray'>
        Error {status ?? 500}
      </p>
      <h1 className='mt-6 text-3xl font-bold lg:text-5xl'>
        {isTemporary ? 'Temporarily unavailable' : 'Something went wrong'}
      </h1>
      <p className='mt-6 max-w-md text-darkGray'>
        {isTemporary
          ? 'We had trouble loading this page. Please wait a moment and try again.'
          : 'An unexpected error occurred while loading this page.'}
      </p>
      <div className='mt-10 flex flex-wrap items-center justify-center gap-4'>
        {reset && (
          <Button label='Try again' onClick={() => reset()} />
        )}
        <Button href='/' label='Return to Home' />
      </div>
    </article>
  );
};

export default SiteErrorPage;
