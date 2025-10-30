'use client';

import React from 'react';
import { Page, Release } from '../../../payload-types';
import ProductListing from '../ProductListing';
import type { ExtendedRelease } from '../../_types/extended-payload-types';

interface ReleasesPageProps {
  data: {
    page: { data: Page | null | undefined };
    releases?: Release[];
  };
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ data }) => {
  const { page, releases } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className='container layout relative overflow-hidden  '>
      {releases && releases.length > 0 && (
        <section>
          {releases.map((release, index) => (
            <li key={index} className='list-none'>
              <ProductListing
                product={release as ExtendedRelease}
                type='release'
              />
            </li>
          ))}
        </section>
      )}
    </article>
  );
};

export default ReleasesPage;
