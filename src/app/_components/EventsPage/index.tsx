'use client';

import React from 'react';

import { Event, Page } from '../../../payload/payload-types';
import EventList from '../EventList';

interface EventsPageProps {
  data: {
    page: { data: Page | null | undefined };
    events?: Event[];
  };
}

const EventsPage: React.FC<EventsPageProps> = ({ data }) => {
  const { page, events } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className="container layout relative overflow-hidden">
      {events && events.length > 0 && (
        <section className="my-12 lg:my-0">
          <EventList events={events} />
        </section>
      )}
    </article>
  );
};

export default EventsPage;
