import type {
  Merch as BaseMerch,
  Release as BaseRelease,
} from '../../payload/payload-types';
import type { ShippingPrices } from './shipping';

export interface ExtendedMerch extends BaseMerch {
  price: number;
  shippingPrices: ShippingPrices;
  stockQuantity?: number;
  isDigital: boolean;
}

export interface ExtendedRelease extends BaseRelease {
  price?: number;
  shippingPrices: ShippingPrices;
  stockQuantity?: number;
  isDigital: boolean;
}
