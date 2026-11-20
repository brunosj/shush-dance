import React from 'react';

import type { Event } from '../../../payload/payload-types';
import EventListing from '../EventListing';

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  // Sort events earliest → latest (most upcoming first)
  const eventsSortedByDate = [...events].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateA.getTime() - dateB.getTime();
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
