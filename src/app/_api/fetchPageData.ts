// fetchPageData.ts
import { fetchPage } from './fetchPage';
import { fetchEvents } from './fetchEvents';
import { fetchReleases } from './fetchReleases';
import { fetchSocials } from './fetchSocials';

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
      };

    // case 'events':
    //   return {
    //     page: basePage,
    //     events: await fetchEvents(),
    //   };

    default:
      return { page: basePage, socials: socials };
  }
};
