import { notFound } from 'next/navigation';
import { fetchPageData } from '../../_api/fetchPageData';
import { PageTemplate } from './page.client';
import { fetchPages } from '../../_api/fetchPages';

interface PageParams {
  params: { slug: string };
}

export default async function Page({ params: { slug = 'home' } }: PageParams) {
  let data;

  try {
    data = await fetchPageData(slug);

    if (!data || !data.page) {
      return notFound();
    }
  } catch (error) {
    console.error(`Failed to fetch data for slug "${slug}":`, error);
    return notFound();
  }

  return <PageTemplate slug={slug} data={data} />;
}

// export async function generateStaticParams() {
//   const pages = await fetchPages();

//   return pages
//     .filter(({ slug }) => slug !== 'home')
//     .map(({ slug }) => ({ slug }));
// }
