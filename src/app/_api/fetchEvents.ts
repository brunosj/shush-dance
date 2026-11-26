import type { Event } from '../../payload/payload-types';

import { getLocalPayload } from './localPayload';

export const fetchEvents = async (): Promise<Event[]> => {
  const payload = await getLocalPayload();
  const eventsRes = await payload.find({
    collection: 'events',
    depth: 2,
    limit: 0,
    pagination: false,
  });

  return (eventsRes.docs ?? []) as Event[];
};