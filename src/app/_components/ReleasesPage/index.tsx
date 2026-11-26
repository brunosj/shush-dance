import React from 'react';

import { Page, Release } from '../../../payload/payload-types';
import type { ExtendedRelease } from '../../_types/extended-payload-types';
import ProductListing from '../ProductListing';

type PageOrLivePreview =
  | Page
  | { data?: Page | null; isLoading?: boolean }
  | null
  | undefined;

export interface ReleasesPageProps {
  data: {
    page: PageOrLivePreview;
    releases?: Release[];
  };
}

function unwrapPage(page: PageOrLivePreview): Page | null {
  if (page == null) return null;
  if ('data' in page && !('title' in page)) {
    return page.data ?? null;
  }
  return page as Page;
}

const ReleasesPage: React.FC<ReleasesPageProps> = ({ data }) => {
  const page = unwrapPage(data.page);
  const { releases } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className="container layout relative overflow-hidden  ">
      {releases && releases.length > 0 && (
        <section>
          {releases.map((release, index) => (
            <li key={index} className="list-none">
              <ProductListing
                product={release as ExtendedRelease}
                type="release"
              />
            </li>
          ))}
        </section>
      )}
    </article>
  );
};

export default ReleasesPage;