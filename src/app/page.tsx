import { notFound } from 'next/navigation';
import { fetchPage } from './_api/fetchPage';
import { fetchSocials } from './_api/fetchSocials';
import { fetchEvents } from './_api/fetchEvents';
import type { Page, Event, Social } from '../payload/payload-types';
import HomepageTemplate from './page.client';

export default async function Page() {
  try {
    const page: Page | null = await fetchPage('home');
    const socials: Social | null = await fetchSocials();
    const events: Event[] = await fetchEvents();

    if (!page) {
      return notFound();
    }

    const data = {
      page,
      socials,
      events,
    };

    return <main>{<HomepageTemplate data={data} />}</main>;
  } catch (error) {
    console.error(`Failed to fetch data for slug "home":`, error);
    return notFound();
  }
}
