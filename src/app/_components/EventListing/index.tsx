import React, { useState } from 'react';
import { formatDate } from '../../_utilities/formatDateTime';
import type { Event, Artist, Media } from '../../../payload/payload-types';
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

  const multiImages = (
    Array.isArray((event as unknown as { images?: Array<{ image?: string | Media | null }> }).images)
      ? (event as unknown as { images?: Array<{ image?: string | Media | null }> }).images
      : []
  )
    .map((row) => row?.image)
    .filter((img): img is Media => Boolean(img) && typeof img !== 'string');

  const legacyImage =
    event.image && typeof event.image !== 'string' ? event.image : null;

  const images: Media[] = [
    ...multiImages,
    ...(legacyImage ? [legacyImage] : []),
  ].filter((img, idx, arr) => arr.findIndex((x) => x.id === img.id) === idx);

  const [hoverImage] = useState<Media | null>(() => {
    if (images.length === 0) return null;
    return images[Math.floor(Math.random() * images.length)] ?? null;
  });

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
      product_data: {
        metadata: {
          isDigital: 'true',
          type: 'ticket',
          itemType: 'ticket',
          eventId: event.id, // Add event ID for proper linking
          eventTitle: event.title,
          eventDate: event.date,
          eventLocation: event.location,
        },
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
        {images.length > 0 && (
          <div className='relative h-full'>
            <div className='flex flex-wrap gap-2 items-start'>
              {images.map((img) => (
                <Image
                  key={img.id}
                  src={img.url ?? ''}
                  alt={img.alt}
                  width={imageHover ? 64 : 200}
                  height={imageHover ? 64 : 200}
                  className={imageHover ? 'object-cover rounded' : 'object-contain w-full h-auto'}
                />
              ))}
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
                      disabled={tier.strikeThrough}
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
      {hoverImage && imageHover && (
        <div
          className='h-32 lg:h-64 w-full absolute opacity-0 group-hover:opacity-80 transition-opacity duration-500 pointer-events-none z-10'
          style={{
            top: imagePosition.top,
            left: imagePosition.left,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <Image
            src={hoverImage.url ?? ''}
            alt={hoverImage.alt}
            fill
            className='object-contain w-full'
          />
        </div>
      )}
    </li>
  );
};

export default EventListing;
