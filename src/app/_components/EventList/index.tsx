import React, { useState } from 'react';
import { formatDate } from '../../_utilities/formatDateTime';
import type { Event, Artist } from '../../../payload/payload-types';
import { useShoppingCart } from 'use-shopping-cart';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Button from '../Button';

interface EventListProps {
  events: Event[];
}

const EventList: React.FC<EventListProps> = ({ events }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { addItem } = useShoppingCart();

  // Sort events by date
  const eventsSortedByDate = events.sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return dateB.getTime() - dateA.getTime();
  });

  const handleAddToCart = (tier, event: Event) => {
    const item = {
      id: tier.stripePriceId,
      name: tier.tierName,
      parentItem: event.title,
      price: tier.price * 100,
      currency: 'EUR',
      quantity: 1,
      description: `Ticket for ${event.title}`,
      priceObject: {
        value: tier.price * 100,
        currency: 'EUR',
      },
    };
    addItem(item, { count: item.quantity });
    toast.success('Added to cart!');
  };

  return (
    <ul className='relative'>
      {eventsSortedByDate.map((event) => {
        const eventDate = new Date(event.date);
        const isPastEvent = eventDate.setHours(0, 0, 0, 0) < today.getTime();

        const [imagePosition] = useState({
          top: `${Math.random() * 80}%`,
          left: `${Math.random() * 80}%`,
        });

        return (
          <li
            key={event.id}
            className='relative mb-4 lg:mb-8 lg:flex space-y-3 lg:space-y-0 lg:space-x-12 group'
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
              <div className='space-y-1 relative z-20'>
                {event.ticketsAvailable &&
                  event.ticketTiers?.map((tier) => (
                    <div key={tier.id}>
                      <Button
                        onClick={() => handleAddToCart(tier, event)}
                        label={`${tier.tierName} - €${tier.price}`}
                      />
                    </div>
                  ))}
              </div>
            </div>

            {/* Image on Hover */}
            {event.image && typeof event.image !== 'string' && (
              <div
                className='h-32 lg:h-64 w-full absolute opacity-0 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none z-10'
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
                  className='object-contain w-full'
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
