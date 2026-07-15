import assert from 'assert';
import {
  splitGrossIntoNetAndVatCents,
  calculateOrderTotalsFromCartItems,
  buildTicketCartId,
  parseTicketCartId,
} from '../src/utilities/tax';

function testSplitGross() {
  const result = splitGrossIntoNetAndVatCents(1000, 7);
  assert.strictEqual(result.netCents, 935);
  assert.strictEqual(result.vatCents, 65);
}

function testTicketOnlyTotals() {
  const totals = calculateOrderTotalsFromCartItems(
    [{ type: 'ticket', grossCents: 1000, quantity: 1, vatRate: 7 }],
    0,
    'germany'
  );
  assert.strictEqual(totals.total, 10);
  assert.strictEqual(totals.ticketVat, 0.65);
  assert.strictEqual(totals.ticketNet, 9.35);
}

function testMixedCartTotals() {
  const totals = calculateOrderTotalsFromCartItems(
    [
      { type: 'ticket', grossCents: 1000, quantity: 1, vatRate: 7 },
      { type: 'merch', grossCents: 2000, quantity: 1 },
    ],
    5.5,
    'germany'
  );
  assert.strictEqual(totals.total, 40.35);
  assert.strictEqual(totals.merchVat, 3.8);
  assert.strictEqual(totals.shippingVat, 1.05);
  assert.strictEqual(totals.ticketGross, 10);
}

function testQuantitiesAreAppliedOnce() {
  const totals = calculateOrderTotalsFromCartItems(
    [{ type: 'ticket', grossCents: 1000, quantity: 2, vatRate: 7 }],
    0,
    'germany'
  );
  assert.strictEqual(totals.total, 20);
  assert.strictEqual(totals.ticketNet, 18.69);
  assert.strictEqual(totals.ticketVat, 1.31);
}

function testVatOverrides() {
  const noVat = calculateOrderTotalsFromCartItems(
    [{ type: 'ticket', grossCents: 1000, quantity: 1, vatRate: 0 }],
    0,
    'germany'
  );
  assert.strictEqual(noVat.ticketVat, 0);

  const customVat = calculateOrderTotalsFromCartItems(
    [{ type: 'ticket', grossCents: 1190, quantity: 1, vatRate: 19 }],
    0,
    'germany'
  );
  assert.strictEqual(customVat.ticketNet, 10);
  assert.strictEqual(customVat.ticketVat, 1.9);
}

function testCartIdRoundTrip() {
  const id = buildTicketCartId('683ab3eb2e7687de6d64adac', '683ab3eb25cbd9e956d25913');
  const parsed = parseTicketCartId(id);
  assert.deepStrictEqual(parsed, {
    eventId: '683ab3eb2e7687de6d64adac',
    tierId: '683ab3eb25cbd9e956d25913',
  });
}

testSplitGross();
testTicketOnlyTotals();
testMixedCartTotals();
testQuantitiesAreAppliedOnce();
testVatOverrides();
testCartIdRoundTrip();

console.log('tax utility tests passed');
