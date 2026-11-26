import { draftMode } from 'next/headers';

import { fetchEvents } from './fetchEvents';
import { fetchMerch } from './fetchMerch';
import { fetchPage } from './fetchPage';
import { fetchReleases } from './fetchReleases';
import { fetchSocials } from './fetchSocials';

export const fetchPageData = async (slug: string) => {
  const { isEnabled: draft } = await draftMode();
  const draftOpts = draft ? { draft: true } : undefined;

  const basePage = await fetchPage(slug);
  const socials = await fetchSocials(draftOpts);

  switch (slug) {
    case 'home':
      return {
        page: basePage,
        socials,
        events: await fetchEvents({ upcomingOnly: true, ...draftOpts }),
      };

    case 'events':
      return {
        page: basePage,
        events: await fetchEvents(draftOpts),
      };

    case 'releases':
      return {
        page: basePage,
        releases: await fetchReleases(draftOpts),
      };

    case 'merch':
      return {
        page: basePage,
        merchItems: await fetchMerch(draftOpts),
      };

    default:
      return { page: basePage, socials };
  }
};
