import type { Payload } from 'payload';
import {
  buildTicketCartId,
  calculateOrderTotalsFromCartItems,
  centsToEuros,
  DEFAULT_TICKET_VAT_RATE,
  isLegacyStripeTicketCartId,
  parseTicketCartId,
  splitGrossIntoNetAndVatCents,
  type CartItemTaxInput,
  type OrderTotalsBreakdown,
} from '../../utilities/tax';
import {
  calculateCartShipping,
  type ShippingPrices,
  type ShippingRegion,
} from '../../app/_types/shipping';
import { isValidTshirtSize } from '../../utilities/productVariants';

export type ValidatedCartItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  type: string;
  metadata: Record<string, unknown>;
  parentItem: string | null;
  productId?: string;
  variant?: string;
  isDigital?: boolean;
  eventId?: string;
  tierId?: string;
  stripePriceId?: string | null;
  vatRate?: number;
  unitNet?: number;
  vatAmount?: number;
};

export type ValidatedOrderData = {
  customerData: Record<string, unknown>;
  cartItems: ValidatedCartItem[];
  totals: OrderTotalsBreakdown;
  shippingRegion: ShippingRegion;
  paymentMethod?: string;
  orderNumber?: string;
};

type IncomingCartItem = {
  id: string;
  name?: string;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  lineTotal?: number;
  type?: string;
  metadata?: Record<string, unknown>;
  parentItem?: string | null;
  tierId?: string;
  stripePriceId?: string | null;
};

const VALID_SHIPPING_REGIONS: ShippingRegion[] = [
  'germany',
  'eu',
  'restOfWorld',
];
const MAX_ITEM_QUANTITY = 100;

function parseQuantity(value: unknown): number {
  const quantity = Number(value);
  if (
    !Number.isFinite(quantity) ||
    !Number.isInteger(quantity) ||
    quantity < 1 ||
    quantity > MAX_ITEM_QUANTITY
  ) {
    throw new Error(
      `Quantity must be a whole number between 1 and ${MAX_ITEM_QUANTITY}`
    );
  }
  return quantity;
}

function validateCustomerData(
  customerData: Record<string, unknown> | undefined
): Record<string, unknown> {
  if (
    !customerData ||
    typeof customerData.email !== 'string' ||
    !customerData.email.includes('@') ||
    typeof customerData.firstName !== 'string' ||
    !customerData.firstName.trim() ||
    typeof customerData.lastName !== 'string' ||
    !customerData.lastName.trim()
  ) {
    throw new Error('Valid customer name and email are required');
  }
  return customerData;
}

function isTicketItem(item: IncomingCartItem): boolean {
  return (
    item.type === 'ticket' ||
    item.metadata?.type === 'ticket' ||
    item.id.startsWith('ticket-') ||
    isLegacyStripeTicketCartId(item.id)
  );
}

async function resolveTicketFromCms(
  payload: Payload,
  eventId: string,
  tierId: string
) {
  const event = await payload.findByID({
    collection: 'events',
    id: eventId,
    depth: 0,
  });

  if (!event?.ticketsAvailable) {
    throw new Error(`Tickets are not available for event ${eventId}`);
  }

  const tiers = Array.isArray(event.ticketTiers) ? event.ticketTiers : [];
  const tier = tiers.find((t: { id?: string }) => t.id === tierId);

  if (!tier) {
    throw new Error(`Ticket tier ${tierId} not found for event ${eventId}`);
  }

  if (!tier.visible) {
    throw new Error(`Ticket tier "${tier.tierName}" is not available`);
  }

  if (tier.strikeThrough) {
    throw new Error(`Ticket tier "${tier.tierName}" is sold out`);
  }

  const price =
    typeof tier.price === 'number'
      ? tier.price
      : parseFloat(String(tier.price));
  if (!Number.isFinite(price) || price <= 0) {
    throw new Error(`Ticket tier "${tier.tierName}" has an invalid price`);
  }

  const vatRate =
    typeof tier.vatRate === 'number' ? tier.vatRate : DEFAULT_TICKET_VAT_RATE;
  if (!Number.isFinite(vatRate) || vatRate < 0 || vatRate > 100) {
    throw new Error(`Ticket tier "${tier.tierName}" has an invalid VAT rate`);
  }

  return {
    event,
    tier,
    grossCents: Math.round(price * 100),
    vatRate,
  };
}

export async function validateAndNormalizeOrderData(
  payload: Payload,
  orderData: {
    customerData: Record<string, unknown>;
    cartItems: IncomingCartItem[];
    totals?: Partial<OrderTotalsBreakdown> & {
      subtotal?: number;
      shipping?: number;
      vat?: number;
      total?: number;
    };
    shippingRegion?: string;
    paymentMethod?: string;
    orderNumber?: string;
  }
): Promise<ValidatedOrderData> {
  if (!Array.isArray(orderData.cartItems) || orderData.cartItems.length > 50) {
    throw new Error('Cart must contain between 1 and 50 items');
  }
  const customerData = validateCustomerData(orderData.customerData);
  if (
    !orderData.shippingRegion ||
    !VALID_SHIPPING_REGIONS.includes(orderData.shippingRegion as ShippingRegion)
  ) {
    throw new Error('A valid shipping region is required');
  }
  const shippingRegion = orderData.shippingRegion as ShippingRegion;
  const validatedItems: ValidatedCartItem[] = [];
  const taxInputs: CartItemTaxInput[] = [];

  for (const item of orderData.cartItems || []) {
    const quantity = parseQuantity(item.quantity);

    if (isTicketItem(item)) {
      const eventId =
        (item.metadata?.eventId as string | undefined) ||
        parseTicketCartId(item.id)?.eventId;
      const tierId =
        (item.metadata?.tierId as string | undefined) ||
        (item.tierId as string | undefined) ||
        parseTicketCartId(item.id)?.tierId;

      if (!eventId || !tierId) {
        throw new Error(
          'Ticket cart item is missing event/tier identity. Please refresh your cart.'
        );
      }

      const resolved = await resolveTicketFromCms(payload, eventId, tierId);
      const lineGrossCents = resolved.grossCents * quantity;
      const { netCents, vatCents } = splitGrossIntoNetAndVatCents(
        lineGrossCents,
        resolved.vatRate
      );

      const cartId = buildTicketCartId(eventId, tierId);
      validatedItems.push({
        id: cartId,
        name: resolved.tier.tierName,
        description: `Ticket for ${resolved.event.title}`,
        quantity,
        unitPrice: resolved.grossCents,
        lineTotal: resolved.grossCents * quantity,
        type: 'ticket',
        metadata: {
          type: 'ticket',
          itemType: 'ticket',
          isDigital: 'true',
          eventId,
          tierId,
          tierName: resolved.tier.tierName,
          vatRate: resolved.vatRate,
          eventTitle: resolved.event.title,
          eventDate: resolved.event.date,
          eventLocation: resolved.event.location,
          stripePriceId: resolved.tier.stripePriceId || null,
        },
        parentItem: String(resolved.event.title || ''),
        eventId,
        tierId,
        stripePriceId: resolved.tier.stripePriceId || null,
        vatRate: resolved.vatRate,
        unitNet: centsToEuros(netCents) / quantity,
        vatAmount: centsToEuros(vatCents),
      });

      taxInputs.push({
        type: 'ticket',
        grossCents: resolved.grossCents,
        quantity,
        vatRate: resolved.vatRate,
      });
      continue;
    }

    const itemType = item.type || (item.metadata?.type as string);
    if (itemType !== 'merch' && itemType !== 'release') {
      throw new Error(`Unsupported cart item type "${itemType || 'unknown'}"`);
    }
    const itemId = item.metadata?.itemId;
    if (typeof itemId !== 'string' || !itemId) {
      throw new Error('Cart item is missing its CMS item ID');
    }

    const cmsItem: any = await payload.findByID({
      collection: itemType === 'merch' ? 'merch' : 'releases',
      id: itemId,
      depth: 0,
    });
    const price = Number(cmsItem?.price);
    if (!Number.isFinite(price) || price <= 0) {
      throw new Error(`"${cmsItem?.title || itemId}" is not available`);
    }
    if (
      typeof cmsItem.stockQuantity === 'number' &&
      cmsItem.stockQuantity < quantity
    ) {
      throw new Error(`Not enough stock for "${cmsItem.title}"`);
    }

    const unitPrice = Math.round(price * 100);
    const variant =
      typeof item.metadata?.variant === 'string'
        ? item.metadata.variant.slice(0, 100)
        : '';
    const shippingPrices = cmsItem.shippingPrices || {
      germany: 0,
      germanyAdditional: 0,
      eu: 0,
      euAdditional: 0,
      restOfWorld: 0,
      restOfWorldAdditional: 0,
    };
    const isDigital = cmsItem.isDigital === true;
    const itemTypeForShipping =
      itemType === 'merch' ? cmsItem.itemType || 'other' : 'vinyl';
    if (
      itemType === 'merch' &&
      cmsItem.itemType === 'clothing' &&
      !isValidTshirtSize(variant)
    ) {
      throw new Error(`Select a valid size for "${cmsItem.title}"`);
    }
    if (
      variant &&
      (itemType !== 'merch' || cmsItem.itemType !== 'clothing')
    ) {
      throw new Error(`"${cmsItem.title}" does not support variants`);
    }

    validatedItems.push({
      id: item.id,
      name: cmsItem.title,
      description:
        itemType === 'release'
          ? `${cmsItem.catalogNumber || ''} - ${cmsItem.releaseYear || ''}`
          : cmsItem.itemType || '',
      quantity,
      unitPrice,
      lineTotal: unitPrice * quantity,
      type: itemType,
      metadata: {
        type: itemType,
        itemId,
        variant,
        isDigital: String(isDigital),
        itemType: itemTypeForShipping,
        shippingPrices,
      },
      parentItem: null,
      productId: itemId,
      variant,
      isDigital,
    });

    taxInputs.push({
      type: itemType,
      grossCents: unitPrice,
      quantity,
    });
  }

  const shippingData = validatedItems
    .filter((item) => item.type !== 'ticket')
    .map((item) => {
      const metadata = item.metadata || {};
      const shippingPrices = metadata.shippingPrices as ShippingPrices;

      return {
        shippingPrices,
        quantity: item.quantity,
        isDigital: metadata.isDigital === 'true',
        type: item.type,
        itemType: (metadata.itemType as string) || 'other',
      };
    });

  const shippingCostEuros = calculateCartShipping(shippingData, shippingRegion);
  const hasShippableItems = validatedItems.some(
    (item) => item.type !== 'ticket' && !item.isDigital
  );
  if (
    hasShippableItems &&
    (typeof customerData.street !== 'string' ||
      !customerData.street.trim() ||
      typeof customerData.city !== 'string' ||
      !customerData.city.trim() ||
      typeof customerData.postalCode !== 'string' ||
      !customerData.postalCode.trim() ||
      typeof customerData.country !== 'string' ||
      !customerData.country.trim())
  ) {
    throw new Error('A complete shipping address is required');
  }
  const totals = calculateOrderTotalsFromCartItems(
    taxInputs,
    shippingCostEuros,
    shippingRegion
  );

  const submittedTotal = Number(orderData.totals?.total);
  if (!Number.isFinite(submittedTotal)) {
    throw new Error('A valid cart total is required');
  }
  if (Math.abs(submittedTotal - totals.total) > 0.02) {
    throw new Error(
      'Cart total is out of date. Please refresh your cart and try again.'
    );
  }

  return {
    customerData,
    cartItems: validatedItems,
    totals,
    shippingRegion,
    paymentMethod: orderData.paymentMethod,
    orderNumber: orderData.orderNumber,
  };
}

export function readValidatedOrderDataFromMetadata(
  metadata: Record<string, string>
): ValidatedOrderData {
  let serialized = metadata.orderData || '';
  if (!serialized && metadata.orderDataChunks) {
    const chunkCount = Number(metadata.orderDataChunks);
    if (!Number.isInteger(chunkCount) || chunkCount < 1 || chunkCount > 100) {
      throw new Error('Invalid order metadata chunk count');
    }
    for (let index = 0; index < chunkCount; index++) {
      serialized += metadata[`orderData_${index}`] || '';
    }
  }
  if (!serialized) {
    throw new Error('No validated order data found in payment metadata');
  }

  const orderData = JSON.parse(serialized) as ValidatedOrderData;
  if (
    !orderData ||
    !Array.isArray(orderData.cartItems) ||
    orderData.cartItems.length === 0 ||
    !Number.isFinite(orderData.totals?.total)
  ) {
    throw new Error('Invalid validated order data in payment metadata');
  }
  const ticketItems = orderData.cartItems.filter(
    (item) => item.type === 'ticket' || item.metadata?.type === 'ticket'
  );
  const physicalItems = orderData.cartItems.filter(
    (item) => item.type !== 'ticket' && item.metadata?.type !== 'ticket'
  );
  const ticketGross =
    ticketItems.reduce((sum, item) => sum + item.lineTotal, 0) / 100;
  orderData.totals = {
    ...orderData.totals,
    merchVat: Number(orderData.totals.merchVat) || Number(orderData.totals.vat) || 0,
    shippingVat: Number(orderData.totals.shippingVat) || 0,
    ticketVat: Number(orderData.totals.ticketVat) || 0,
    ticketNet: Number(orderData.totals.ticketNet) || ticketGross,
    ticketGross: Number(orderData.totals.ticketGross) || ticketGross,
    merchNet:
      Number(orderData.totals.merchNet) ||
      physicalItems.reduce((sum, item) => sum + item.lineTotal, 0) / 100,
  };
  orderData.cartItems = orderData.cartItems.map((item) => ({
    ...item,
    eventId:
      item.eventId ||
      (typeof item.metadata?.eventId === 'string'
        ? item.metadata.eventId
        : undefined),
    tierId:
      item.tierId ||
      (typeof item.metadata?.tierId === 'string'
        ? item.metadata.tierId
        : undefined),
    vatRate:
      typeof item.vatRate === 'number'
        ? item.vatRate
        : typeof item.metadata?.vatRate === 'number'
          ? item.metadata.vatRate
          : 0,
  }));
  return orderData;
}
