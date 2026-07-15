'use client';

import SiteErrorPage from './_components/SiteErrorPage';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <SiteErrorPage error={error} reset={reset} />;
}
