// componentMapping.tsx
import type { Page } from '../../payload/payload-types';
import HomePage from './HomePage';
import CartPage from './CartPage';
import EventsPage from './EventsPage';
import ReleasesPage from './ReleasesPage';

const componentMapping: { [key: string]: React.FC<{ data: any }> } = {
  home: HomePage,
  cart: CartPage,
  events: EventsPage,
  releases: ReleasesPage,
};
export default componentMapping;
