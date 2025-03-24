'use client';

import React from 'react';
import { Page, Event, Social, Release } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import EventList from '../EventList';
import Link from 'next/link';
import { useShoppingCart } from 'use-shopping-cart';
import Button from '../Button';
import EventListing from '../EventListing';
import ReleaseCard from '../ReleaseCard';

interface HomePageProps {
  data: {
    page: { data: Page | null | undefined };
    socials: Social;
    events?: Event[];
    releases?: Release[];
  };
}

const HomePage: React.FC<HomePageProps> = ({ data }) => {
  const { page, events, socials } = data;
  const { cartCount } = useShoppingCart();

  const upcomingEvents = events?.filter((event) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const eventDate = new Date(event.date);
    eventDate.setHours(0, 0, 0, 0);

    return eventDate.getTime() >= today.getTime();
  });

  const latestRelease = data.releases?.[0];

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className='relative overflow-hidden'>
      <div className='mx-2 lg:mx-24 my-24 lg:my-32 lg:flex relative lg:gap-32 flex-grow-0'>
        <aside className=' text-left text-lg  '>
          <div className='lg:fixed lg:w-1/4 lg:top-1/2 transform lg:-translate-y-1/2'>
            <RichText content={page.data.content} />

            {socials && socials.items.length > 0 && (
              <nav className='mt-6 lg:mt-12 lowercase'>
                <ul className='space-y-1'>
                  {socials.items.map((social) => (
                    <li key={social.id} className=''>
                      <Button
                        href={social.link.url}
                        target={social.link.newTab ? '_blank' : ''}
                        label={social.link.label}
                        textStyles='text-xs'
                      />
                    </li>
                  ))}
                </ul>
              </nav>
            )}
          </div>
        </aside>

        <div className='w-full lg:w-2/3 ml-auto space-y-6 lg:space-y-12 mt-12 lg:mt-0'>
          {page.data.showEventsFirst ? (
            <>
              {upcomingEvents && upcomingEvents.length > 0 && (
                <div className='space-y-6 border-gray pb-6 lg:pb-12 border-b'>
                  <h2>
                    {upcomingEvents.length > 1
                      ? 'Upcoming Events'
                      : 'Upcoming Event'}
                  </h2>
                  <ul className='lg:space-y-8 space-y-4'>
                    {upcomingEvents.map((event) => (
                      <EventListing
                        key={event.id}
                        event={event}
                        imageHover={false}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {latestRelease && (
                <div className='space-y-6  '>
                  <h2>Announcing!</h2>
                  <ul className='list-none'>
                    <ReleaseCard release={latestRelease} />
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              {latestRelease && (
                <div className='space-y-6  border-gray pb-6 lg:pb-12 border-b'>
                  <h2>Announcing!</h2>
                  <ul className='list-none'>
                    <ReleaseCard release={latestRelease} />
                  </ul>
                </div>
              )}

              {upcomingEvents && upcomingEvents.length > 0 && (
                <div className='space-y-6'>
                  <h2>
                    {upcomingEvents.length >= 1
                      ? 'Upcoming Events'
                      : 'Upcoming Event'}
                  </h2>
                  <ul className='lg:space-y-8 space-y-4'>
                    {upcomingEvents.map((event) => (
                      <EventListing key={event.id} event={event} />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default HomePage;
