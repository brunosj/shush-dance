// componentMapping.tsx
import CartPage from './CartPage';
import EventsPage from './EventsPage';
import HomePage from './HomePage';
import ImprintPage from './ImprintPage';
import MerchPage from './MerchPage';
import ReleasesPage from './ReleasesPage';

const componentMapping: { [key: string]: React.FC<{ data: any }> } = {
  home: HomePage,
  cart: CartPage,
  events: EventsPage,
  releases: ReleasesPage,
  imprint: ImprintPage,
  merch: MerchPage,
};
export default componentMapping;
