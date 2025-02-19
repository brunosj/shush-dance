import React, { useState } from 'react';
import type {
  Release,
  Track,
  Artist,
  Media,
  Merch,
} from '../../../payload/payload-types';
import Image from 'next/image';
import { RichText } from '../RichText';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Button from '../Button';

interface MerchListingProps {
  merch: Merch;
}

const MerchListing: React.FC<MerchListingProps> = ({ merch }) => {
  const { title, itemType, description, mainImage, images, buyLink } = merch;

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
        <div className='lg:flex space-y-3  my-auto flex-col'>
          <h2 className='release-title'>{title}</h2>
          <h4 className='release-artist'>{itemType}</h4>
          {/* <h4 className='release-catalog-number'>{itemType}</h4> */}
          {/* Buy Link */}

          <div className='pt-3 my-auto'>
            <Button
              href={buyLink}
              label={buyLink ? 'buy' : 'sold out'}
              target='_blank'
              disabled={buyLink === undefined}
            />
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
