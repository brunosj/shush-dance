'use client';

import React from 'react';
import { Page, Event, Release } from '../../../payload/payload-types';
import { RichText } from '../RichText';

interface ImprintPageProps {
  data: {
    page: { data: Page | null | undefined };
  };
}

const ImprintPage: React.FC<ImprintPageProps> = ({ data }) => {
  const { page } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className='container layout relative overflow-hidden  '>
      <RichText content={page.data.content} className='richText' />
    </article>
  );
};

export default ImprintPage;
