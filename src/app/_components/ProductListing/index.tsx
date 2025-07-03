import React, { useState } from 'react';
import type {
  Release,
  Track,
  Artist,
  Media,
  Merch,
} from '../../../payload/payload-types';
import type {
  ExtendedMerch,
  ExtendedRelease,
} from '../../_types/extended-payload-types';
import Image from 'next/image';
import { RichText } from '../RichText';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import Button from '../Button';
import AddToCartButton from '../AddToCartButton';

interface ProductListingProps {
  product: ExtendedMerch | ExtendedRelease;
  type: 'merch' | 'release';
}

const ProductListing: React.FC<ProductListingProps> = ({ product, type }) => {
  const [activeSlide, setActiveSlide] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string>('');

  // Define available sizes for t-shirts
  const tshirtSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

  // Common properties
  const { title, description, images, price } = product;

  // Type-specific properties with type guards
  const isRelease = type === 'release';
  const isMerch = type === 'merch';

  // Get main image based on type
  const mainImageUrl = isRelease
    ? (() => {
        const artwork = (product as ExtendedRelease).artwork;
        return typeof artwork === 'string' ? artwork : artwork.url;
      })()
    : (() => {
        const mainImage = (product as ExtendedMerch).mainImage;
        return typeof mainImage === 'string' ? mainImage : mainImage.url;
      })();

  // Release-specific data
  const releaseData = isRelease
    ? {
        artist: (product as ExtendedRelease).artist,
        catalogNumber: (product as ExtendedRelease).catalogNumber,
        releaseYear: (product as ExtendedRelease).releaseYear,
        tracks: (product as ExtendedRelease).tracks,
        credits: (product as ExtendedRelease).credits,
      }
    : null;

  // Merch-specific data
  const merchData = isMerch
    ? {
        itemType: (product as ExtendedMerch).itemType,
      }
    : null;

  const artistName = releaseData?.artist
    ? typeof releaseData.artist === 'string'
      ? releaseData.artist
      : releaseData.artist.artistName
    : undefined;

  const transformedImages = images?.map((img) => {
    const imageUrl = typeof img.image === 'string' ? img.image : img.image.url;
    return { src: imageUrl, alt: `${title} additional image` };
  });

  // Check if this item is clothing based on the structured itemType field
  const isClothingItem = merchData?.itemType === 'clothing';

  const handleThumbnailClick = (index: number) => {
    setActiveSlide(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  // Create anchor ID using slug or fallback to ID
  const anchorId = product.slug || product.id;

  return (
    <div
      id={anchorId}
      className='release-item mb-8 space-y-6 lg:space-y-12 pt-3 lg:pt-0 scroll-mt-24'
    >
      <div className='lg:grid grid-cols-2 gap-6 lg:gap-12'>
        {/* Artwork/Main Image */}
        {mainImageUrl && (
          <div className='release-artwork relative h-[40vh] w-full'>
            <Image
              src={mainImageUrl}
              alt={`${title} artwork`}
              fill
              className='object-contain object-left w-full h-auto cursor-pointer'
              onClick={() => handleThumbnailClick(0)}
            />
          </div>
        )}

        {/* Product Details */}
        <div className='lg:flex space-y-3 my-auto flex-col pt-6 lg:pt-0'>
          <div className='space-y-2'>
            <h2 className='release-title leading-snug'>{title}</h2>
            <div className='flex items-center gap-3'>
              {isRelease && artistName && (
                <h4 className='release-artist'>{artistName}</h4>
              )}
              {isRelease &&
                releaseData?.catalogNumber &&
                releaseData?.releaseYear && (
                  <h4 className='release-catalog-number'>
                    {releaseData.catalogNumber} - {releaseData.releaseYear}
                  </h4>
                )}
            </div>
            {price && price > 0 && (
              <div className='text-base lg:text-lg font-semibold'>
                €{price.toFixed(2)}
              </div>
            )}
          </div>

          <div className='pt-3 my-auto'>
            {/* Size selector for apparel items */}
            {isClothingItem && (
              <div className='mb-4 w-1/2'>
                <label
                  htmlFor='size-select'
                  className='block text-sm font-medium text-gray-700 mb-2'
                >
                  Size
                </label>
                <select
                  id='size-select'
                  value={selectedSize}
                  onChange={(e) => setSelectedSize(e.target.value)}
                  className='text-sm block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'
                  required
                >
                  <option value=''>Select a size</option>
                  {tshirtSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <AddToCartButton
              item={product as any}
              type={type}
              selectedVariant={isClothingItem ? selectedSize : undefined}
              disabled={isClothingItem && !selectedSize}
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

      {/* Credits (Release only) */}
      {isRelease && releaseData?.credits && releaseData.credits.length > 0 && (
        <div className='release-credits'>
          <h4 className='font-semibold mb-4'>Credits</h4>
          <RichText content={releaseData.credits} className='richTextSmallP' />
        </div>
      )}

      {/* Tracks (Release only) */}
      {isRelease && releaseData?.tracks && releaseData.tracks.length > 0 && (
        <div className='release-tracks'>
          <h4 className='font-semibold text-sm'>Tracks</h4>
          <ul className='list-disc list-inside'>
            {releaseData.tracks.map((track, index) => {
              const trackName = typeof track === 'string' ? track : track.title;
              return <li key={index}>{trackName}</li>;
            })}
          </ul>
        </div>
      )}

      {/* Additional Images & Thumbnails */}
      {transformedImages && transformedImages.length > 0 && (
        <div className='pb-6'>
          <h4 className='font-semibold mb-4'>Images</h4>
          <div className='release-images flex gap-4'>
            {transformedImages.map((img, index) => (
              <div
                key={index}
                className='release-image relative aspect-square w-full'
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className={`w-full object-cover cursor-pointer ${
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

export default ProductListing;
