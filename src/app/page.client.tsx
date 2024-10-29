'use client';

import React from 'react';
import type { Page, Event, Social } from '../payload/payload-types';
import EventList from './_components/EventList';
import { useShoppingCart } from 'use-shopping-cart';
import Button from './_components/Button';
import { RichText } from './_components/RichText';

interface HomePageProps {
  data: {
    page: Page | null | undefined;
    socials: Social | null;
    events: Event[];
  };
}

const HomepageTemplate: React.FC<HomePageProps> = ({ data }) => {
  const { page, events, socials } = data;
  const { cartCount } = useShoppingCart();

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className='relative overflow-hidden'>
      <div className='px-2 lg:px-24 py-24 lg:py-32 lg:flex relative lg:gap-32'>
        <aside className='lg:w-1/3 text-left text-lg'>
          <div className='lg:fixed lg:w-1/4 lg:top-1/2 transform lg:-translate-y-1/2'>
            <RichText content={page.content} className='text-sm lg:text-lg' />

            {socials && socials.items?.length > 0 && (
              <nav className='mt-6 lg:mt-12 lowercase'>
                <ul className='space-y-1'>
                  {socials.items.map((social) => (
                    <li key={social.id}>
                      <Button
                        href={social.link.url}
                        target={social.link.newTab ? '_blank' : undefined}
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

        {events && events.length > 0 && (
          <section className='my-12 lg:my-0'>
            <EventList events={events} />
          </section>
        )}
      </div>
    </article>
  );
};

export default HomepageTemplate;
