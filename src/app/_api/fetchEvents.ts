import type { Event } from '../../payload/payload-types';

import { CACHE_TAGS } from './cacheTags';
import { cached } from './cached';
import { getLocalPayload } from './localPayload';

async function queryEvents(options?: {
  upcomingOnly?: boolean;
}): Promise<Event[]> {
  const payload = await getLocalPayload();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const eventsRes = await payload.find({
    collection: 'events',
    depth: 1,
    limit: options?.upcomingOnly ? 50 : 0,
    pagination: false,
    sort: 'date',
    where: options?.upcomingOnly
      ? {
          date: {
            greater_than_equal: today.toISOString(),
          },
        }
      : undefined,
  });

  return (eventsRes.docs ?? []) as Event[];
}

export const fetchEvents = async (options?: {
  upcomingOnly?: boolean;
  draft?: boolean;
}): Promise<Event[]> => {
  if (options?.draft) {
    return queryEvents(options);
  }

  const day = new Date().toISOString().slice(0, 10);
  const key = options?.upcomingOnly
    ? `events-upcoming-${day}`
    : 'events-all';
  return cached(() => queryEvents(options), [key], {
    tags: [CACHE_TAGS.site, CACHE_TAGS.events],
    revalidate: options?.upcomingOnly ? 60 * 60 : false,
  })();
};
