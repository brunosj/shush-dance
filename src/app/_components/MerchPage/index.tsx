'use client';

import React from 'react';
import { Page, Merch } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import EventList from '../EventList';
import Link from 'next/link';
import { useShoppingCart } from 'use-shopping-cart';
import Button from '../Button';
import ReleaseListing from '../ReleaseListing';
import MerchListing from '../MerchListing';

interface MerchPageProps {
  data: {
    page: { data: Page | null | undefined };
    merch?: Merch[];
  };
}

const MerchPage: React.FC<MerchPageProps> = ({ data }) => {
  const { page, merch } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  console.log(merch);
  return (
    <article className='container layout relative overflow-hidden  '>
      {/* {merch && merch.length > 0 && (
        <section>
          {merch.map((release, index) => (
            <li key={index} className='list-none'>
              <MerchListing merch={merch} />
            </li>
          ))}
        </section>
      )} */}
    </article>
  );
};

export default MerchPage;
