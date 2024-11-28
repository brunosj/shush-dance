'use client';

import React from 'react';
import { Page } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import EventList from '../EventList';
import Link from 'next/link';
import { useShoppingCart } from 'use-shopping-cart';
import Button from '../Button';
import ReleaseListing from '../ReleaseListing';

interface MerchPageProps {
  data: {
    page: { data: Page | null | undefined };
    merch?: any[];
  };
}

const MerchPage: React.FC<MerchPageProps> = ({ data }) => {
  const { page, merch } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className='container layout relative overflow-hidden  '>
      {merch && merch.length > 0 && (
        <section>
          {/* {releases.map((release, index) => (
            <li key={index} className='list-none'>
              <ReleaseListing release={release} />
            </li>
          ))} */}
        </section>
      )}
    </article>
  );
};

export default MerchPage;
