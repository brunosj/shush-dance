import type { AfterChangeHook } from 'payload/dist/collections/config/types';

// ensure that the home page is revalidated at '/' instead of '/home'
export const formatAppURL = ({ doc }): string => {
  const pathToUse = doc.slug === 'home' ? '' : doc.slug;
  const { pathname } = new URL(
    `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/${pathToUse}`,
  );
  return pathname;
};

function getRevalidationSecret(): string | undefined {
  return process.env.REVALIDATION_KEY || process.env.NEXT_PRIVATE_REVALIDATION_KEY;
}

// Revalidate the page in the background, so the user doesn't have to wait
// Notice that the hook itself is not async and we are not awaiting `revalidate`
export const revalidatePage: AfterChangeHook = ({ doc, previousDoc, req }) => {
  // Only bust the frontend cache when a published page is created/updated
  const shouldRevalidate =
    doc?._status === 'published' || previousDoc?._status === 'published';

  if (!shouldRevalidate || !doc?.slug) {
    return doc;
  }

  const revalidate = async (): Promise<void> => {
    let url: string | undefined;

    try {
      url = formatAppURL({ doc });
      const secret = getRevalidationSecret();
      if (!secret) {
        req.payload.logger.error('Missing REVALIDATION_KEY for page revalidation');
        return;
      }

      const endpoint = new URL(
        '/next/revalidate',
        process.env.PAYLOAD_PUBLIC_SERVER_URL,
      );
      endpoint.searchParams.set('secret', secret);
      endpoint.searchParams.set('collection', 'pages');
      endpoint.searchParams.set('slug', doc.slug);
      endpoint.searchParams.set('revalidatePath', url);

      const res = await fetch(endpoint.toString());

      if (res.ok) {
        req.payload.logger.info(`Revalidated path ${url}`);
      } else {
        req.payload.logger.error(
          `Error revalidating path ${url}: ${res.status}`,
        );
      }
    } catch (_err: unknown) {
      req.payload.logger.error(`Error hitting revalidate route for ${url}`);
    }
  };

  void revalidate();

  return doc;
};
