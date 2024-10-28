// componentMapping.tsx
import type { Page } from '../../payload/payload-types';
import HomePage from './HomePage';
import CartPage from './CartPage';

const componentMapping: { [key: string]: React.FC<{ data: any }> } = {
  home: HomePage,
  cart: CartPage,
  // Add other page components here
};
export default componentMapping;
