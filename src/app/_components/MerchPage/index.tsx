'use client';

import React from 'react';
import { Page, Merch } from '../../../payload/payload-types';
import ProductListing from '../ProductListing';
import type { ExtendedMerch } from '../../_types/extended-payload-types';

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
            <li
              key={index}
              className='list-none mb-12 border-b border-gray-300 last:border-b-0'
            >
              <ProductListing
                product={merchItem as ExtendedMerch}
                type='merch'
              />
            </li>
          ))}
        </section>
      )}
    </article>
  );
};

export default MerchPage;
