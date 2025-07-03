import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Release, Merch } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import Button from '../Button';

interface ProductCardProps {
  product: Release | Merch;
  type: 'release' | 'merch';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, type }) => {
  const isRelease = type === 'release';

  // Get the appropriate image based on type
  const imageUrl = isRelease
    ? (() => {
        const artwork = (product as Release).artwork;
        return typeof artwork === 'string' ? artwork : artwork.url;
      })()
    : (() => {
        const mainImage = (product as Merch).mainImage;
        return typeof mainImage === 'string' ? mainImage : mainImage.url;
      })();

  // Get the appropriate link with anchor
  const basePath = isRelease ? '/releases' : '/merch';
  const anchor = product.slug || product.id; // Fallback to ID if no slug
  const linkHref = `${basePath}#${anchor}`;

  // Release-specific data
  const releaseData = isRelease
    ? {
        artist: (product as Release).artist,
        tracks: (product as Release).tracks,
      }
    : null;

  const artistName = releaseData?.artist
    ? typeof releaseData.artist === 'string'
      ? releaseData.artist
      : releaseData.artist.artistName
    : undefined;

  return (
    <li
      key={product.id}
      className='relative lg:grid grid-cols-5 space-y-3 lg:space-y-0 lg:space-x-12 group'
    >
      <div className='relative w-32 h-32 lg:w-40 lg:h-40'>
        <Link href={linkHref} className=''>
          {/* Image */}
          {imageUrl && (
            <Image
              src={imageUrl}
              alt={product.title}
              fill
              className='object-contain w-full'
            />
          )}
        </Link>
      </div>
      <div className='col-span-4'>
        <div className={`space-y-4 pb-3 lg:pb-0`}>
          <div>
            <h3 className='font-semibold'>{product.title}</h3>
            {isRelease && artistName && <p>{artistName}</p>}
          </div>

          {/* Tracks (Release only) */}
          {isRelease && releaseData?.tracks && (
            <div>
              {releaseData.tracks.map((track, index) => (
                <p key={index}>
                  {typeof track === 'string' ? track : track.title}
                </p>
              ))}
            </div>
          )}

          {/* Description */}
          {product.description && (
            <div>
              <RichText
                content={product.description}
                className='richTextSmallP'
              />
            </div>
          )}

          {/* Learn More Button */}
          <div className='pt-3'>
            <Button href={linkHref} label='Learn More' />
          </div>
        </div>
      </div>
    </li>
  );
};

export default ProductCard;
