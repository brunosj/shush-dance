import config from '@payload-config';
import { getPayload, type Payload } from 'payload';

let payloadPromise: Promise<Payload> | null = null;

/**
 * Local Payload instance for RSC data loading.
 * Avoids HTTP self-requests to the same Next dev server (which deadlock in dev).
 */
export async function getLocalPayload(): Promise<Payload> {
  if (!payloadPromise) {
    payloadPromise = getPayload({ config });
  }
  return payloadPromise;
}