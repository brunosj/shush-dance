// componentMapping.tsx
import HomePage from './HomePage';
import CartPage from './CartPage';
import EventsPage from './EventsPage';
import ReleasesPage from './ReleasesPage';
import ImprintPage from './ImprintPage';
import MerchPage from './MerchPage';

const componentMapping: { [key: string]: React.FC<{ data: any }> } = {
  home: HomePage,
  cart: CartPage,
  events: EventsPage,
  releases: ReleasesPage,
  imprint: ImprintPage,
  merch: MerchPage,
};
export default componentMapping;
