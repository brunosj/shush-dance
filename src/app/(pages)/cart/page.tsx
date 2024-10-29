import { notFound } from 'next/navigation';
import { fetchPage } from '../../_api/fetchPage';
import type { Page } from '../../../payload/payload-types';
import CartPageTemplate from './page.client';

export default async function Page() {
  try {
    const page: Page | null = await fetchPage('cart');

    if (!page) {
      return notFound();
    }

    const data = {
      page,
    };

    return <main>{<CartPageTemplate data={data} />}</main>;
  } catch (error) {
    console.error(`Failed to fetch data for slug "cart":`, error);
    return notFound();
  }
}
