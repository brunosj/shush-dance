import React, { useState } from 'react';
import type {
  Release,
  Track,
  Artist,
  Media,
} from '../../../payload/payload-types';
import Image from 'next/image';
import { RichText } from '../RichText';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';

interface ReleaseListingProps {
  release: Release;
}

const ReleaseListing: React.FC<ReleaseListingProps> = ({ release }) => {
  const {
    title,
    tracks,
    artist,
    description,
    credits,
    artwork,
    images,
    catalogNumber,
    releaseYear,
  } = release;

  const artistName = typeof artist === 'string' ? artist : artist.artistName;
  const artworkUrl = typeof artwork === 'string' ? artwork : artwork.url;

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

  console.log(transformedImages);
  return (
    <div className='release-item mb-8 space-y-12'>
      <div className='lg:flex gap-12 items-center'>
        {/* Artwork */}
        {artworkUrl && (
          <div className='release-artwork relative w-48 h-48'>
            <Image
              src={artworkUrl}
              alt={`${title} artwork`}
              fill
              className='object-contain w-full h-auto cursor-pointer'
              onClick={() => handleThumbnailClick(0)}
            />
          </div>
        )}

        {/* Release Details */}
        <div className='space-y-1'>
          <h2 className='release-title'>{title}</h2>
          <h4 className='release-artist'>{artistName}</h4>
          <h4 className='release-catalog-number'>
            {catalogNumber} - {releaseYear}
          </h4>
        </div>
      </div>

      {/* Description */}
      {description && description.length > 0 && (
        <div className='release-description'>
          <RichText content={description} className='richTextSmallP' />
        </div>
      )}

      {/* Credits */}
      {credits && credits.length > 0 && (
        <div className='release-credits'>
          <h4 className='font-semibold mb-4'>Credits</h4>
          <RichText content={credits} className='richTextSmallP' />
        </div>
      )}

      {/* Tracks */}
      {tracks && tracks.length > 0 && (
        <div className='release-tracks'>
          <h4 className='font-semibold text-sm'>Tracks</h4>
          <ul className='list-disc list-inside'>
            {tracks.map((track, index) => {
              const trackName = typeof track === 'string' ? track : track.title;
              return <li key={index}>{trackName}</li>;
            })}
          </ul>
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

export default ReleaseListing;
