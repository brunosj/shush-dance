import React from 'react';

import {
  Event,
  Merch,
  Page,
  Release,
  Social,
} from '../../../payload/payload-types';
import { resolveCmsLink } from '../../../utilities/resolveRichTextHref';
import RenderBlocks from '../Blocks';
import Button from '../Button';
import EventListing from '../EventListing';
import ProductCard from '../ProductCard';
import { RichText } from '../RichText';

type PageOrLivePreview =
  | Page
  | { data?: Page | null; isLoading?: boolean }
  | null
  | undefined;

export interface HomePageProps {
  data: {
    /** Live preview wraps as `{ data: Page }`; server render passes `Page`. */
    page: PageOrLivePreview;
    socials: Social;
    events?: Event[];
  };
}

function resolveRelationshipDoc<T extends Release | Merch>(
  value: string | T | null | undefined,
): T | null {
  if (value == null || typeof value === 'string') {
    return null;
  }
  return value;
}

function unwrapPage(page: PageOrLivePreview): Page | null {
  if (page == null) return null;
  // Live preview wraps as `{ data: Page, isLoading }` — not a Page doc.
  if ('data' in page && !('title' in page)) {
    return page.data ?? null;
  }
  return page as Page;
}

const HomePage: React.FC<HomePageProps> = ({ data }) => {
  const page = unwrapPage(data.page);
  const { events, socials } = data;

  const upcomingEvents = events
    ?.slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const featuredRelease = resolveRelationshipDoc<Release>(page?.featuredRelease);
  const featuredMerch = resolveRelationshipDoc<Merch>(page?.featuredMerch);

  if (!page) {
    return <p>Loading...</p>;
  }

  return (
    <article className="relative overflow-hidden">
      <div className="mx-2 lg:mx-24 my-24 lg:my-32 lg:flex relative lg:gap-32 flex-grow-0">
        <aside className=" text-left text-lg  ">
          <div className="lg:fixed lg:w-1/4 lg:top-1/2 transform lg:-translate-y-1/2">
            <RichText content={page.content} />
            <RenderBlocks blocks={page.layout} />

            {socials && socials.items.length > 0 && (
              <nav className="mt-6 lg:mt-12 lowercase">
                <ul className="space-y-1">
                  {socials.items.map((social) => {
                    const resolved = resolveCmsLink(social.link);
                    return (
                      <li key={social.id} className="">
                        <Button
                          href={resolved.href}
                          target={resolved.newTab ? '_blank' : ''}
                          label={resolved.label}
                          textStyles="text-xs"
                        />
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>
        </aside>

        <div className="w-full lg:w-2/3 ml-auto space-y-6 lg:space-y-12 mt-12 lg:mt-0">
          {page.showEventsFirst ? (
            <>
              {upcomingEvents && upcomingEvents.length > 0 && (
                <div className="space-y-6 border-brand-gray pb-6 lg:pb-12 border-b">
                  <h2>
                    {upcomingEvents.length > 1
                      ? 'Upcoming Events'
                      : 'Upcoming Event'}
                  </h2>
                  <ul className="divide-y border-brand-gray [&>li]:py-4 lg:[&>li]:py-8 [&>li:first-child]:pt-0 [&>li:last-child]:pb-0">
                    {upcomingEvents.map((event) => (
                      <EventListing
                        key={event.id}
                        event={event}
                        imageHover={false}
                      />
                    ))}
                  </ul>
                </div>
              )}

              {featuredRelease && (
                <div className="space-y-6 border-brand-gray pb-6 lg:pb-12 border-b">
                  <ul className="list-none">
                    <ProductCard product={featuredRelease} type="release" />
                  </ul>
                </div>
              )}

              {featuredMerch && (
                <div className="space-y-6">
                  <ul className="list-none">
                    <ProductCard product={featuredMerch} type="merch" />
                  </ul>
                </div>
              )}
            </>
          ) : (
            <>
              {featuredRelease && (
                <div className="space-y-6 border-brand-gray pb-6 lg:pb-12 border-b">
                  <h2>Announcing!</h2>
                  <ul className="list-none">
                    <ProductCard product={featuredRelease} type="release" />
                  </ul>
                </div>
              )}

              {featuredMerch && (
                <div className="space-y-6 border-brand-gray pb-6 lg:pb-12 border-b">
                  <h2>Latest Merch</h2>
                  <ul className="list-none">
                    <ProductCard product={featuredMerch} type="merch" />
                  </ul>
                </div>
              )}

              {upcomingEvents && upcomingEvents.length > 0 && (
                <div className="space-y-6">
                  <h2>
                    {upcomingEvents.length >= 1
                      ? 'Upcoming Events'
                      : 'Upcoming Event'}
                  </h2>
                  <ul className="divide-y border-brand-gray [&>li]:py-4 lg:[&>li]:py-8 [&>li:first-child]:pt-0 [&>li:last-child]:pb-0">
                    {upcomingEvents.map((event) => (
                      <EventListing key={event.id} event={event} />
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default HomePage;
