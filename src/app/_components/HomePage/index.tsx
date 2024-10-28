'use client';

import React from 'react';
import { Page, Event, Social } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import EventList from '../EventList';
import Link from 'next/link';
import { useShoppingCart } from 'use-shopping-cart';
import { IoTicketOutline } from 'react-icons/io5';

interface HomePageProps {
  data: {
    page: { data: Page | null | undefined };
    socials: Social;
    events?: Event[];
  };
}

const HomePage: React.FC<HomePageProps> = ({ data }) => {
  const { page, events, socials } = data;
  const { cartCount } = useShoppingCart();

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className='relative '>
      <div className='px-2 lg:px-24 py-24 lg:py-32 lg:flex relative lg:gap-32'>
        <aside className='lg:w-1/3 text-left text-lg  '>
          <div className='lg:fixed lg:w-1/4 lg:top-1/2 transform lg:-translate-y-1/2'>
            <RichText
              content={page.data.content}
              className='text-base lg:text-lg'
            />
            {/* {cartCount > 0 && (
              <div className='pl-4 mt-4'>
                <Link href='/cart' className='relative'>
                  <IoTicketOutline className='w-8 h-8 textHover' />
                  <div className='rounded-full flex justify-center items-center bg-black text-xs text-white absolute w-5 h-5 -bottom-7 -left-2'>
                    {cartCount}
                  </div>
                </Link>
              </div>
            )} */}
            {socials && socials.items.length > 0 && (
              <nav className='mt-6 lg:mt-12'>
                <ul className='space-y-1'>
                  {socials.items.map((social) => (
                    <li key={social.id} className=''>
                      <Link
                        href={social.link.url}
                        target={social.link.newTab ? '_blank' : ''}
                      >
                        <span className='py-1 px-2 bg-black text-pri  hover:bg-opacity-75 duration-200 ease-in-out text-xs'>
                          {social.link.label}
                        </span>
                      </Link>
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

export default HomePage;
