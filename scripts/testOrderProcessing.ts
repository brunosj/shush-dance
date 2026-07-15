import assert from 'assert';
import { processStripeOrderSuccess } from '../src/payload/utils/processStripeOrder';
import type { ValidatedOrderData } from '../src/payload/utils/validateOrderData';

const records: Record<string, any[]> = {
  'online-orders': [],
  'ticket-sales': [],
  sales: [],
};
const products: Record<string, any> = {
  merch1: { id: 'merch1', stockQuantity: 5 },
};
let emailCount = 0;

function matchesWhere(doc: any, where: any): boolean {
  if (where.and) return where.and.every((part: any) => matchesWhere(doc, part));
  return Object.entries(where).every(([field, condition]: [string, any]) => {
    const value = doc[field];
    return condition?.equals === value;
  });
}

const payload = {
  find: async ({ collection, where }: any) => ({
    docs: (records[collection] || []).filter((doc) => matchesWhere(doc, where)),
  }),
  create: async ({ collection, data }: any) => {
    const doc = { id: `${collection}-${records[collection].length + 1}`, ...data };
    records[collection].push(doc);
    return doc;
  },
  findByID: async ({ collection, id }: any) => {
    if (collection === 'events') return { id, ticket_email_footer: null };
    return products[id];
  },
  update: async ({ collection, id, data }: any) => {
    const record = records[collection]?.find((doc) => doc.id === id);
    if (record) {
      Object.assign(record, data);
      return record;
    }
    products[id] = { ...products[id], ...data };
    return products[id];
  },
  sendEmail: async () => {
    emailCount++;
  },
} as any;

const orderData: ValidatedOrderData = {
  customerData: {
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'Customer',
    street: 'Teststr. 1',
    city: 'Berlin',
    postalCode: '10115',
    country: 'Germany',
  },
  shippingRegion: 'germany',
  totals: {
    subtotal: 40,
    shipping: 5.5,
    vat: 6.15,
    merchVat: 3.8,
    shippingVat: 1.05,
    ticketVat: 1.3,
    ticketNet: 18.7,
    ticketGross: 20,
    merchNet: 20,
    total: 50.35,
  },
  cartItems: [
    {
      id: 'ticket-event1-tier1',
      name: 'Event 1',
      description: 'Ticket for Event 1',
      quantity: 1,
      unitPrice: 1000,
      lineTotal: 1000,
      type: 'ticket',
      parentItem: 'Event 1',
      eventId: 'event1',
      tierId: 'tier1',
      vatRate: 7,
      metadata: {
        type: 'ticket',
        eventId: 'event1',
        eventTitle: 'Event 1',
      },
    },
    {
      id: 'ticket-event2-tier2',
      name: 'Event 2',
      description: 'Ticket for Event 2',
      quantity: 1,
      unitPrice: 1000,
      lineTotal: 1000,
      type: 'ticket',
      parentItem: 'Event 2',
      eventId: 'event2',
      tierId: 'tier2',
      vatRate: 7,
      metadata: {
        type: 'ticket',
        eventId: 'event2',
        eventTitle: 'Event 2',
      },
    },
    {
      id: 'merch_merch1_germany_XL',
      name: 'T-Shirt',
      description: 'clothing',
      quantity: 1,
      unitPrice: 2000,
      lineTotal: 2000,
      type: 'merch',
      parentItem: null,
      productId: 'merch1',
      variant: 'XL',
      isDigital: false,
      metadata: { type: 'merch', itemId: 'merch1' },
    },
  ],
};

async function run() {
  const first = await processStripeOrderSuccess(
    payload,
    'pi_test',
    orderData,
    'stripe',
    'ignored'
  );
  const second = await processStripeOrderSuccess(
    payload,
    'pi_test',
    orderData,
    'stripe',
    'ignored'
  );

  assert.strictEqual(first.created, true);
  assert.strictEqual(second.created, false);
  assert.strictEqual(records['online-orders'].length, 1);
  assert.strictEqual(records['ticket-sales'].length, 2);
  assert.strictEqual(records.sales.length, 1);
  assert.strictEqual(products.merch1.stockQuantity, 4);
  assert.strictEqual(
    records['online-orders'][0].items[0].cartItemDescription,
    'clothing (Variant: XL)'
  );
  assert.strictEqual(records['ticket-sales'][0].ticketTotals.vat, 0.65);
  assert.strictEqual(emailCount, 6);
  console.log('order processing tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
