import type { Metadata } from 'next';
import { draftMode } from 'next/headers';
import { notFound } from 'next/navigation';

import { fetchPage } from '../../../_api/fetchPage';
import { fetchPageData } from '../../../_api/fetchPageData';
import EventsPage from '../../../_components/EventsPage';
import HomePage from '../../../_components/HomePage';
import MerchPage from '../../../_components/MerchPage';
import ReleasesPage from '../../../_components/ReleasesPage';
import { getSiteUrl } from '../../../_utilities/siteUrl';
import { PageTemplate } from './page.client';

const SERVER_CATALOG_SLUGS = new Set(['events', 'releases', 'merch']);

interface PageParams {
  params: Promise<{ slug?: string }>;
}

function pagePathFromSlug(slug: string): string {
  return slug === 'home' ? '' : `/${slug}`;
}

export async function generateMetadata({
  params,
}: PageParams): Promise<Metadata> {
  const { slug: slugParam } = await params;
  const slug = slugParam || 'home';
  const page = await fetchPage(slug);

  if (!page) {
    return {};
  }

  const siteUrl = getSiteUrl();
  const path = pagePathFromSlug(slug);
  const seoTitle = page.meta?.title?.trim() || page.title;
  const description = page.meta?.description?.trim();
  const keywordsRaw = page.meta?.keywords?.trim();

  return {
    title: seoTitle,
    ...(description ? { description } : {}),
    ...(keywordsRaw
      ? {
          keywords: keywordsRaw
            .split(',')
            .map((k) => k.trim())
            .filter(Boolean),
        }
      : {}),
    alternates: {
      canonical: `${siteUrl}${path}`,
    },
    openGraph: {
      title: seoTitle,
      ...(description ? { description } : {}),
      url: `${siteUrl}${path}`,
    },
  };
}

export default async function Page({ params }: PageParams) {
  const { slug: slugParam } = await params;
  const slug = slugParam || 'home';
  const { isEnabled: isDraft } = await draftMode();

  let data;

  try {
    data = await fetchPageData(slug);

    if (!data || !data.page) {
      return notFound();
    }
  } catch (error) {
    console.error(`Failed to fetch data for slug "${slug}":`, error);
    throw error;
  }

  // Live preview needs a client boundary; public traffic stays on the server tree.
  if (isDraft) {
    return <PageTemplate slug={slug} data={data} />;
  }

  if (slug === 'home') {
    return (
      <main>
        <HomePage data={data} />
      </main>
    );
  }

  if (SERVER_CATALOG_SLUGS.has(slug)) {
    const CatalogPage =
      slug === 'events'
        ? EventsPage
        : slug === 'releases'
          ? ReleasesPage
          : MerchPage;

    return (
      <main>
        <CatalogPage data={data} />
      </main>
    );
  }

  return <PageTemplate slug={slug} data={data} />;
}
