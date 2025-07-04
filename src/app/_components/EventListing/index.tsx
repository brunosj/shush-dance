import React, { useState } from 'react';
import { formatDate } from '../../_utilities/formatDateTime';
import type { Event, Artist } from '../../../payload/payload-types';
import { useShoppingCart } from 'use-shopping-cart';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Button from '../Button';
import { RichText } from '../RichText';

interface EventListingProps {
  event: Event;
  imageHover?: boolean;
}

const EventListing: React.FC<EventListingProps> = ({
  event,
  imageHover = true,
}) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { addItem } = useShoppingCart();

  const eventDate = new Date(event.date);
  const isPastEvent = eventDate.setHours(0, 0, 0, 0) < today.getTime();

  const [imagePosition] = useState({
    top: `${Math.random() * 80}%`,
    left: `${Math.random() * 80}%`,
  });

  const handleAddToCart = (tier) => {
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
    <li
      key={event.id}
      className='relative lg:grid grid-cols-5 space-y-3 lg:space-y-0 lg:space-x-16 group'
    >
      <div className='flex-grow-0'>
        {event.image && typeof event.image !== 'string' && !imageHover && (
          <div className='relative h-full'>
            <div className='flex flex-col items-start'>
              <Image
                src={event.image.url}
                alt={event.image.alt}
                width={200}
                height={200}
                className='object-contain w-full h-auto'
              />
            </div>
          </div>
        )}
      </div>

      <div
        className={`space-y-4 pb-3 col-span-4 lg:pb-0 ${isPastEvent ? 'opacity-30' : ''}`}
      >
        <div>
          <h3 className='font-semibold'>
            {event.title} @ {event.location}
          </h3>
          <p className='pt-3 italic font-semibold'>
            <span className={` ${isPastEvent ? 'opacity-30' : ''}`}>
              {formatDate(event.date)}
            </span>
            {event.time && !isPastEvent && (
              <span className={`pl-2 `}>- {event.time}</span>
            )}
          </p>
        </div>

        {/* Artists */}
        <div>
          {event.artists?.map((artist: Artist) => {
            const artistName =
              typeof artist === 'string' ? artist : artist.artistName;
            const artistKey = typeof artist === 'string' ? artist : artist.id;

            return (
              <div key={artistKey}>
                <p>{artistName}</p>
              </div>
            );
          })}
        </div>

        {/* Tickets */}
        {!isPastEvent && (
          <div className='space-y-1 relative z-20'>
            {event.ticketsAvailable &&
              event.ticketTiers?.map((tier) => (
                <div key={tier.id}>
                  {tier.visible && (
                    <Button
                      onClick={() => handleAddToCart(tier)}
                      label={`${tier.tierName} - €${tier.price}`}
                    />
                  )}
                </div>
              ))}
          </div>
        )}

        {/* Event Information */}
        {!isPastEvent && (
          <div>
            <RichText
              content={event.event_information}
              className='richTextSmallP'
            />
          </div>
        )}
      </div>

      {/* Image on Hover */}
      {event.image && typeof event.image !== 'string' && imageHover && (
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
};

export default EventListing;
