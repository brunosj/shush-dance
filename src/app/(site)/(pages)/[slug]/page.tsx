import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

import { fetchPageData } from '../../../_api/fetchPageData';
import { PageTemplate } from './page.client';

interface PageParams {
  params: Promise<{ slug?: string }>;
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
