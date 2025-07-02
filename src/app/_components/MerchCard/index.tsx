import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { Merch } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import Button from '../Button';

interface MerchCardProps {
  merch: Merch;
}

const MerchCard: React.FC<MerchCardProps> = ({ merch }) => {
  return (
    <li
      key={merch.id}
      className='relative lg:grid grid-cols-5 space-y-3 lg:space-y-0 lg:space-x-12 group'
    >
      <div className='relative w-32 h-32 lg:w-40 lg:h-40'>
        <Link href='/merch' className=''>
          {/* Main Image */}
          {merch.mainImage && (
            <Image
              src={
                typeof merch.mainImage === 'string'
                  ? merch.mainImage
                  : merch.mainImage.url
              }
              alt={merch.title}
              fill
              className='object-contain w-full'
            />
          )}
        </Link>
      </div>
      <div className='col-span-4'>
        <div className={`space-y-4 pb-3 lg:pb-0`}>
          <div>
            <h3 className='font-semibold'>{merch.title}</h3>
            {/* <p className='capitalize'>{merch.itemType}</p> */}
          </div>

          {/* Description */}
          {merch.description && (
            <div>
              <RichText
                content={merch.description}
                className='richTextSmallP'
              />
            </div>
          )}

          {/* Learn More Button */}
          <div className='pt-3'>
            <Button href='/merch' label='Learn More' />
          </div>
        </div>
      </div>
    </li>
  );
};

export default MerchCard;
