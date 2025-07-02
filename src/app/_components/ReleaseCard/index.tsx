import React from 'react';
import { useShoppingCart } from 'use-shopping-cart';
import toast from 'react-hot-toast';
import Image from 'next/image';
import Button from '../Button';
import { RichText } from '../RichText';
import type { Release, Artist } from '../../../payload/payload-types';
import Link from 'next/link';

interface ReleaseCardProps {
  release: Release;
}

const ReleaseCard: React.FC<ReleaseCardProps> = ({ release }) => {
  return (
    <li
      key={release.id}
      className='relative lg:grid grid-cols-5 space-y-3 lg:space-y-0 lg:space-x-12 group'
    >
      <div className='relative w-32 h-32 lg:w-40 lg:h-40'>
        <Link href='/releases' className=''>
          {/* Artwork  */}
          {release.artwork && (
            <Image
              src={
                typeof release.artwork === 'string'
                  ? release.artwork
                  : release.artwork.url
              }
              alt={release.title}
              fill
              className='object-contain w-full'
            />
          )}
        </Link>
      </div>
      <div className='col-span-4'>
        <div className={`space-y-4 pb-3 lg:pb-0`}>
          <div>
            <h3 className='font-semibold'>{release.title}</h3>
            <p>
              {typeof release.artist === 'string'
                ? release.artist
                : release.artist.artistName}
            </p>
          </div>

          {/* Tracks */}
          <div>
            {release.tracks?.map((track, index) => (
              <p key={index}>
                {typeof track === 'string' ? track : track.title}
              </p>
            ))}
          </div>

          {/* Description */}
          {release.description && (
            <div>
              <RichText
                content={release.description}
                className='richTextSmallP'
              />
            </div>
          )}

          {/* Learn More Button */}
          <div className='pt-3'>
            <Button href='/releases' label='Learn More' />
          </div>
        </div>
      </div>
    </li>
  );
};

export default ReleaseCard;
