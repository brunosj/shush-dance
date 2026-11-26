import React from 'react';

import { Merch, Page } from '../../../payload/payload-types';
import type { ExtendedMerch } from '../../_types/extended-payload-types';
import ProductListing from '../ProductListing';

type PageOrLivePreview =
  | Page
  | { data?: Page | null; isLoading?: boolean }
  | null
  | undefined;

export interface MerchPageProps {
  data: {
    page: PageOrLivePreview;
    merchItems?: Merch[];
  };
}

function unwrapPage(page: PageOrLivePreview): Page | null {
  if (page == null) return null;
  if ('data' in page && !('title' in page)) {
    return page.data ?? null;
  }
  return page as Page;
}

const MerchPage: React.FC<MerchPageProps> = ({ data }) => {
  const page = unwrapPage(data.page);
  const { merchItems } = data;

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className="container layout relative overflow-hidden  ">
      {merchItems && merchItems.length > 0 && (
        <section>
          {merchItems.map((merchItem, index) => (
            <li
              key={index}
              className="list-none mb-12 border-b border-gray-300 last:border-b-0"
            >
              <ProductListing
                product={merchItem as ExtendedMerch}
                type="merch"
              />
            </li>
          ))}
        </section>
      )}
    </article>
  );
};

export default MerchPage;