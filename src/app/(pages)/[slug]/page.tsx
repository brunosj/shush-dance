// page.tsx
import { notFound } from 'next/navigation';
import { fetchPageData } from '../../_api/fetchPageData';
import { PageTemplate } from './page.client';
import { fetchPages } from '../../_api/fetchPages';
import { fetchEvents } from '../../_api/fetchEvents';
interface PageParams {
  params: { slug: string };
}

export default async function Page({ params: { slug = 'home' } }: PageParams) {
  const data = await fetchPageData(slug);
  if (!data.page) {
    return notFound();
  }

  return <PageTemplate slug={slug} data={data} />;
}

export async function generateStaticParams() {
  const pages = await fetchPages();

  return pages.map(({ slug }) =>
    slug !== 'home'
      ? {
          slug,
        }
      : {}
  );
}
