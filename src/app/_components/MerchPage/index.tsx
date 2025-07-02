'use client';

import React from 'react';
import { Page, Merch } from '../../../payload/payload-types';
import MerchListing from '../MerchListing';
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
              className='list-none mb-10 border-b border-gray-200'
            >
              <MerchListing merch={merchItem as ExtendedMerch} />
            </li>
          ))}
        </section>
      )}
    </article>
  );
};

export default MerchPage;
