import assert from 'assert';
import { validateAndNormalizeOrderData } from '../src/payload/utils/validateOrderData';

const docs: Record<string, Record<string, any>> = {
  events: {
    event1: {
      id: 'event1',
      title: 'Test Event',
      ticketsAvailable: true,
      date: '2026-08-01',
      location: 'Berlin',
      ticketTiers: [
        {
          id: 'tier1',
          tierName: 'Advance',
          price: 10,
          vatRate: 7,
          visible: true,
          strikeThrough: false,
        },
        {
          id: 'sold',
          tierName: 'Sold out',
          price: 10,
          vatRate: 7,
          visible: true,
          strikeThrough: true,
        },
      ],
    },
  },
  merch: {
    merch1: {
      id: 'merch1',
      title: 'T-Shirt',
      price: 20,
      itemType: 'clothing',
      stockQuantity: 5,
      isDigital: false,
      shippingPrices: {
        germany: 5.5,
        germanyAdditional: 2.5,
        eu: 10,
        euAdditional: 5,
        restOfWorld: 15,
        restOfWorldAdditional: 8,
      },
    },
  },
  releases: {
    release1: {
      id: 'release1',
      title: 'Download',
      price: 15,
      isDigital: true,
      catalogNumber: 'TEST001',
      releaseYear: 2026,
      shippingPrices: {
        germany: 0,
        germanyAdditional: 0,
        eu: 0,
        euAdditional: 0,
        restOfWorld: 0,
        restOfWorldAdditional: 0,
      },
    },
  },
};

const payload = {
  findByID: async ({ collection, id }: { collection: string; id: string }) => {
    const doc = docs[collection]?.[id];
    if (!doc) throw new Error('Not found');
    return doc;
  },
} as any;

const customerData = {
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'Customer',
  street: 'Teststr. 1',
  city: 'Berlin',
  postalCode: '10115',
  country: 'Germany',
};

async function testTicketQuantityAndVat() {
  const result = await validateAndNormalizeOrderData(payload, {
    customerData,
    shippingRegion: 'germany',
    cartItems: [
      {
        id: 'ticket-event1-tier1',
        quantity: 2,
        unitPrice: 1,
        metadata: { type: 'ticket', eventId: 'event1', tierId: 'tier1' },
      },
    ],
    totals: { total: 20 },
  });
  assert.strictEqual(result.cartItems[0].lineTotal, 2000);
  assert.strictEqual(result.totals.total, 20);
  assert.strictEqual(result.totals.ticketVat, 1.31);
}

async function testCmsMerchPriceAndShipping() {
  const result = await validateAndNormalizeOrderData(payload, {
    customerData,
    shippingRegion: 'germany',
    cartItems: [
      {
        id: 'tampered',
        quantity: 1,
        unitPrice: 1,
        metadata: {
          type: 'merch',
          itemId: 'merch1',
          variant: 'XL',
          shippingPrices: '{}',
        },
      },
    ],
    totals: { total: 30.35 },
  });
  assert.strictEqual(result.cartItems[0].unitPrice, 2000);
  assert.strictEqual(result.cartItems[0].variant, 'XL');
  assert.strictEqual(result.totals.shipping, 5.5);
  assert.strictEqual(result.totals.total, 30.35);
}

async function testDigitalReleaseHasNoShipping() {
  const result = await validateAndNormalizeOrderData(payload, {
    customerData: {
      email: customerData.email,
      firstName: customerData.firstName,
      lastName: customerData.lastName,
    },
    shippingRegion: 'germany',
    cartItems: [
      {
        id: 'release',
        quantity: 1,
        metadata: { type: 'release', itemId: 'release1' },
      },
    ],
    totals: { total: 17.85 },
  });
  assert.strictEqual(result.totals.shipping, 0);
  assert.strictEqual(result.totals.total, 17.85);
}

async function testRejections() {
  await assert.rejects(
    validateAndNormalizeOrderData(payload, {
      customerData,
      shippingRegion: 'germany',
      cartItems: [
        {
          id: 'ticket-event1-sold',
          quantity: 1,
          metadata: { type: 'ticket', eventId: 'event1', tierId: 'sold' },
        },
      ],
      totals: { total: 10 },
    }),
    /sold out/
  );

  await assert.rejects(
    validateAndNormalizeOrderData(payload, {
      customerData,
      shippingRegion: 'invalid',
      cartItems: [
        {
          id: 'ticket-event1-tier1',
          quantity: 1,
          metadata: { type: 'ticket', eventId: 'event1', tierId: 'tier1' },
        },
      ],
      totals: { total: 10 },
    }),
    /shipping region/
  );

  await assert.rejects(
    validateAndNormalizeOrderData(payload, {
      customerData,
      shippingRegion: 'germany',
      cartItems: [
        {
          id: 'ticket-event1-tier1',
          quantity: 1.5,
          metadata: { type: 'ticket', eventId: 'event1', tierId: 'tier1' },
        },
      ],
      totals: { total: 15 },
    }),
    /whole number/
  );

  await assert.rejects(
    validateAndNormalizeOrderData(payload, {
      customerData,
      shippingRegion: 'germany',
      cartItems: [
        {
          id: 'merch_merch1_germany_INVALID',
          quantity: 1,
          metadata: {
            type: 'merch',
            itemId: 'merch1',
            variant: 'INVALID',
          },
        },
      ],
      totals: { total: 30.35 },
    }),
    /valid size/
  );
}

async function run() {
  await testTicketQuantityAndVat();
  await testCmsMerchPriceAndShipping();
  await testDigitalReleaseHasNoShipping();
  await testRejections();
  console.log('order validation tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
