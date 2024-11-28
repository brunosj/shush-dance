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
    merchItems?: Merch[];
  };
}

const MerchPage: React.FC<MerchPageProps> = ({ data }) => {
  const { page, merchItems } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className='container layout relative overflow-hidden  '>
      {merchItems && merchItems.length > 0 && (
        <section>
          {merchItems.map((merchItem, index) => (
            <li key={index} className='list-none'>
              <MerchListing merch={merchItem} />
            </li>
          ))}
        </section>
      )}
    </article>
  );
};

export default MerchPage;
