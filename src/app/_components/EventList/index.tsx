import React from 'react';
import type { Event } from '../../../payload-types';
import EventListing from '../EventListing';

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  // Sort events by date
  const eventsSortedByDate = events.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <ul className='relative space-y-6'>
      {eventsSortedByDate.map((event) => (
        <EventListing key={event.id} event={event} />
      ))}
    </ul>
  );
};

export default EventList;
