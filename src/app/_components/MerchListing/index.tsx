import React, { useState } from 'react';
import type {
  Release,
  Track,
  Artist,
  Media,
  Merch,
} from '../../../payload/payload-types';
import type { ExtendedMerch } from '../../_types/extended-payload-types';
import Image from 'next/image';
import { RichText } from '../RichText';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Button from '../Button';
import AddToCartButton from '../AddToCartButton';

interface MerchListingProps {
  merch: ExtendedMerch;
}

const MerchListing: React.FC<MerchListingProps> = ({ merch }) => {
  const { title, itemType, description, mainImage, images, price } = merch;

  // const artistName = typeof artist === 'string' ? artist : artist.artistName;
  const mainImageUrl =
    typeof mainImage === 'string' ? mainImage : mainImage.url;

  const transformedImages = images?.map((img) => {
    const imageUrl = typeof img.image === 'string' ? img.image : img.image.url;
    return { src: imageUrl, alt: `${title} additional image` };
  });

  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  const handleThumbnailClick = (index: number) => {
    setActiveSlide(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <div className='release-item mb-8 space-y-6 lg:space-y-12'>
      <div className='lg:grid grid-cols-2 gap-6 lg:gap-12'>
        {/* Artwork */}
        {mainImageUrl && (
          <div className='release-artwork relative h-[40vh] w-full'>
            <Image
              src={mainImageUrl}
              alt={`${title} artwork`}
              fill
              className='object-contain w-full h-auto'
              // onClick={() => handleThumbnailClick(0)}
            />
          </div>
        )}
        {/* Release Details */}
        <div className='lg:flex space-y-3 my-auto flex-col'>
          <div className='space-y-1'>
            <h2 className='release-title'>{title}</h2>
            <div className='flex items-center gap-3'>
              <h4 className='release-artist'>{itemType}</h4>
              {price && price > 0 && (
                <span className='text-lg font-semibold'>
                  €{price.toFixed(2)}
                </span>
              )}
            </div>
          </div>

          {/* Additional Product Info */}
          {price && price > 0 && (
            <div className='space-y-1'>
              <p className='text-sm text-gray-600'>
                {merch.isDigital
                  ? 'Digital Product'
                  : 'Physical Product + Shipping'}
              </p>
              <p className='text-xs text-gray-500'>
                (Price excludes VAT and shipping)
              </p>
            </div>
          )}

          <div className='pt-3 my-auto'>
            <AddToCartButton item={merch as any} type='merch' />
          </div>
        </div>
      </div>

      {/* Description */}
      {description && description.length > 0 && (
        <div className='release-description'>
          <RichText content={description} className='richTextSmallP' />
        </div>
      )}

      {/* Additional Images & Thumbnails */}
      {transformedImages && transformedImages.length > 0 && (
        <div>
          <h4 className='font-semibold mb-4'>Images</h4>
          <div className='release-images flex gap-4'>
            {transformedImages.map((img, index) => (
              <div key={index} className='release-image'>
                <Image
                  src={img.src}
                  alt={img.alt}
                  width={150}
                  height={150}
                  className={`object-cover cursor-pointer ${
                    index === activeSlide
                      ? 'border-purple-500'
                      : 'border-transparent'
                  }`}
                  onClick={() => handleThumbnailClick(index)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lightbox Component */}
      <Lightbox
        open={lightboxOpen}
        close={closeLightbox}
        slides={transformedImages ?? []}
        index={activeSlide}
      />
    </div>
  );
};

export default MerchListing;
