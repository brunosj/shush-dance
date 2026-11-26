import React from 'react';

import { Event, Page } from '../../../payload/payload-types';
import EventList from '../EventList';

type PageOrLivePreview =
  | Page
  | { data?: Page | null; isLoading?: boolean }
  | null
  | undefined;

export interface EventsPageProps {
  data: {
    page: PageOrLivePreview;
    events?: Event[];
  };
}

function unwrapPage(page: PageOrLivePreview): Page | null {
  if (page == null) return null;
  if ('data' in page && !('title' in page)) {
    return page.data ?? null;
  }
  return page as Page;
}

const EventsPage: React.FC<EventsPageProps> = ({ data }) => {
  const page = unwrapPage(data.page);
  const { events } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className="container layout relative overflow-hidden">
      {events && events.length > 0 && (
        <section className="my-12 lg:my-0">
          <EventList events={events} sortOrder="desc" />
        </section>
      )}
    </article>
  );
};

export default EventsPage;