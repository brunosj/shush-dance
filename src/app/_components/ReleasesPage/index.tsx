'use client';

import React from 'react';
import { Page, Event, Release } from '../../../payload/payload-types';
import { RichText } from '../RichText';
import EventList from '../EventList';
import Link from 'next/link';
import { useShoppingCart } from 'use-shopping-cart';
import Button from '../Button';
import ReleaseListing from '../ReleaseListing';

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
    <article className='container layout relative overflow-hidden'>
      {releases && releases.length > 0 && (
        <section className='my-12 lg:my-0'>
          {releases.map((release, index) => (
            <li key={index} className='list-none'>
              <ReleaseListing release={release} />
            </li>
          ))}
        </section>
      )}
    </article>
  );
};

export default ReleasesPage;
