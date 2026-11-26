import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { fetchPage } from '../../../_api/fetchPage';
import { fetchPageData } from '../../../_api/fetchPageData';
import { getSiteUrl } from '../../../_utilities/siteUrl';
import { PageTemplate } from './page.client';

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

  return <PageTemplate slug={slug} data={data} />;
}

// export async function generateStaticParams() {
//   const pages = await fetchPages();

//   return pages
//     .filter(
//       ({ slug }) => slug !== 'home' && slug !== 'media' && slug !== 'audio'
//     )
//     .map(({ slug }) => ({ slug }));
// }
