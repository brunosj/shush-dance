import React from 'react';

import type { Event } from '../../../payload/payload-types';
import EventListing from '../EventListing';

interface EventListProps {
  events: Event[];
  /** Default: earliest → latest. Use 'desc' for latest → earliest. */
  sortOrder?: 'asc' | 'desc';
}

const EventList: React.FC<EventListProps> = ({
  events,
  sortOrder = 'asc',
}) => {
  const eventsSortedByDate = [...events].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <ul className="relative divide-y border-gray [&>li]:py-6 [&>li:first-child]:pt-0 [&>li:last-child]:pb-0">
      {eventsSortedByDate.map((event) => (
        <EventListing key={event.id} event={event} />
      ))}
    </ul>
  );
};

export default EventList;
