'use client';

import React from 'react';

import { Page } from '../../../payload/payload-types';
import RenderBlocks from '../Blocks';
import { RichText } from '../RichText';

interface ContentPageProps {
  data: {
    page: { data: Page | null | undefined };
  };
}

const ContentPage: React.FC<ContentPageProps> = ({ data }) => {
  const { page } = data;

  if (!page?.data) {
    return <p>Loading...</p>;
  }

  return (
    <article className="container layout relative overflow-hidden">
      <RichText content={page.data.content} className="richText" />
      <RenderBlocks blocks={page.data.layout} />
    </article>
  );
};

export default ContentPage;
