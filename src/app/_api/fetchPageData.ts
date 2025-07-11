// fetchPageData.ts
import { fetchPage } from './fetchPage';
import { fetchEvents } from './fetchEvents';
import { fetchReleases } from './fetchReleases';
import { fetchSocials } from './fetchSocials';
import { fetchMerch } from './fetchMerch';

export const fetchPageData = async (slug: string) => {
  // Base page data fetched for all pages
  const basePage = await fetchPage(slug);
  const socials = await fetchSocials();

  // Additional data fetched conditionally based on the slug
  switch (slug) {
    case 'home':
      return {
        page: basePage,
        socials: socials,
        events: await fetchEvents(),
        releases: await fetchReleases(),
        merchItems: await fetchMerch(),
      };

    case 'events':
      return {
        page: basePage,
        events: await fetchEvents(),
      };

    case 'releases':
      return {
        page: basePage,
        releases: await fetchReleases(),
      };

    case 'merch':
      return {
        page: basePage,
        merchItems: await fetchMerch(),
      };

    default:
      return { page: basePage, socials: socials };
  }
};
