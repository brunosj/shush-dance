import Link from 'next/link';
import React from 'react';

import type { Media, Merch, Release } from '../../../payload/payload-types';
import {
  resolveMediaResource,
  resolveMediaUrl,
} from '../../_utilities/getMediaUrl';
import { CMSImage } from '../CMSImage';
import Button from '../Button';
import { RichText } from '../RichText';

interface ProductCardProps {
  product: Release | Merch;
  type: 'release' | 'merch';
}

const ProductCard: React.FC<ProductCardProps> = ({ product, type }) => {
  const isRelease = type === 'release';

  const imageResource: string | Media | null | undefined = isRelease
    ? (product as Release).artwork
  : (product as Merch).mainImage;

  const imageUrl =
    typeof imageResource === 'string'
      ? resolveMediaUrl(imageResource)
      : resolveMediaResource(imageResource);

  const imageMedia =
    imageResource && typeof imageResource !== 'string' ? imageResource : null;

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
      className="relative lg:grid grid-cols-5 space-y-3 lg:space-y-0 lg:space-x-12 group"
    >
      <div className="relative w-32 h-32 lg:w-40 lg:h-40">
        <Link href={linkHref} className="">
          {/* Image */}
          {imageUrl && (
            <CMSImage
              src={imageUrl}
              alt={product.title}
              media={imageMedia}
              fill
              className="object-contain w-full"
            />
          )}
        </Link>
      </div>
      <div className="col-span-4">
        <div className={`space-y-4 pb-3 lg:pb-0`}>
          <div>
            <h3 className="font-semibold">{product.title}</h3>
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
                className="richTextSmallP"
              />
            </div>
          )}

          {/* Learn More Button */}
          <div className="pt-3">
            <Button href={linkHref} label="Learn More" />
          </div>
        </div>
      </div>
    </li>
  );
};

export default ProductCard;
