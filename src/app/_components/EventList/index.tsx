'use client';

import React, { useState } from 'react';
import { formatDate } from '../../_utilities/formatDateTime';
import type { Event, Artist } from '../../../payload/payload-types';
import { useShoppingCart } from 'use-shopping-cart';
import toast from 'react-hot-toast';
import Image from 'next/image';

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { addItem } = useShoppingCart(); // Hook to manage cart state

  // Sort events by date
  const eventsSortedByDate = events.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  // Function to handle adding ticket to the cart
  const handleAddToCart = (tier) => {
    const item = {
      id: tier.stripePriceId,
      name: tier.tierName,
      price: tier.price * 100,
      currency: 'EUR',
      quantity: 1,
      description: `Ticket for ${tier.tierName}`,
    };
    addItem(item, { count: item.quantity });
    console.log('Item added to cart:', item);
    toast.success('Item added to cart!');
  };

  return (
    <ul>
      {eventsSortedByDate.map((event) => {
        const eventDate = new Date(event.date);
        const isPastEvent = eventDate.setHours(0, 0, 0, 0) < today.getTime();

        const [imagePosition, setImagePosition] = useState({
          top: `${Math.random() * 80}%`,
          left: `${Math.random() * 80}%`,
        });

        return (
          <li
            key={event.id}
            className={`relative mb-4 lg:mb-8 lg:flex space-y-3 lg:space-y-0 lg:space-x-12 ${isPastEvent ? 'group' : ''}`}
          >
            <div>
              <p className={`font-semibold ${isPastEvent ? 'opacity-30' : ''}`}>
                {formatDate(event.date)}
              </p>
            </div>

            <div
              className={`space-y-4 pb-3 lg:pb-0 ${isPastEvent ? 'opacity-30' : ''}`}
            >
              <h3 className='font-semibold'>
                {event.title} @ {event.location}
              </h3>
              {/* Artists */}
              <div>
                {event.artists?.map((artist: Artist) => {
                  const artistName =
                    typeof artist === 'string' ? artist : artist.artistName;
                  const artistKey =
                    typeof artist === 'string' ? artist : artist.id;

                  return (
                    <div key={artistKey}>
                      <p>{artistName}</p>
                    </div>
                  );
                })}
              </div>
              {/* Tickets */}
              <div className='space-y-1 flex flex-col '>
                {event.ticketsAvailable &&
                  event.ticketTiers?.map((tier) => (
                    <button
                      key={tier.id}
                      className='inline-flex'
                      onClick={() => handleAddToCart(tier)}
                    >
                      <p className='py-1 px-2 bg-black text-pri  hover:bg-opacity-75 duration-200 ease-in-out '>
                        {tier.tierName} - ${tier.price}
                      </p>
                      {/* <div className='hidden lg:inline text-black group-hover:text-pri px-4 py-2 rounded duration-200'>
                        Add to Cart
                      </div> */}
                    </button>
                  ))}
              </div>
            </div>
            {/* Image */}
            {!isPastEvent && event.image && typeof event.image !== 'string' && (
              <div className='h-64 w-full lg:w-64 relative'>
                <Image
                  src={event.image.url}
                  alt={event.image.alt}
                  fill
                  className='object-contain'
                />
              </div>
            )}
            {/* Image Past Events*/}
            {isPastEvent && event.image && typeof event.image !== 'string' && (
              <div
                className={`h-64 w-full absolute opacity-0 group-hover:opacity-80 transition-opacity duration-500`}
                style={{
                  top: imagePosition.top,
                  left: imagePosition.left,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <Image
                  src={event.image.url}
                  alt={event.image.alt}
                  fill
                  className='object-contain'
                />
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
};

export default EventList;
