import type { Payload } from 'payload';

import {
  type BuyerAnswerSet,
  formatBuyerAnswerSetsForDisplay,
} from '../../utilities/buyerQuestions';
import { normalizeCurrency } from '../../utilities/currency';
import {
  getMerchVatRate,
  splitGrossIntoNetAndVatCents,
} from '../../utilities/tax';
import { allocateStripeFeeEuros } from './stripeFees';
import {
  fetchEventFooterHtml,
  renderEventFooterSection,
} from './ticketEmailFooter';
import type {
  ValidatedCartItem,
  ValidatedOrderData,
} from './validateOrderData';

function splitItems(orderData: ValidatedOrderData) {
  const ticketItems = orderData.cartItems.filter(
    (item) => item.type === 'ticket' || item.metadata?.type === 'ticket',
  );
  const physicalItems = orderData.cartItems.filter(
    (item) => item.type !== 'ticket' && item.metadata?.type !== 'ticket',
  );
  return { ticketItems, physicalItems };
}

function shouldSendConfirmationEmail(args: {
  isFallback: boolean;
  createdThisInvocation: boolean;
  alreadySent: boolean;
}): boolean {
  if (args.alreadySent) return false;
  // Fallback path only emails when it created the record; otherwise the
  // webhook owns confirmation (avoids duplicate "Fallback Processing" mail).
  if (args.isFallback) return args.createdThisInvocation;
  return true;
}

async function claimConfirmationEmailSent(
  payload: Payload,
  collection: 'ticket-sales' | 'online-orders',
  id: string,
) {
  await payload.update({
    collection,
    id,
    data: { confirmationEmailSent: true },
  });
}

async function releaseConfirmationEmailSent(
  payload: Payload,
  collection: 'ticket-sales' | 'online-orders',
  id: string,
) {
  try {
    await payload.update({
      collection,
      id,
      data: { confirmationEmailSent: false },
    });
  } catch (error) {
    console.error(
      `Failed to release confirmationEmailSent on ${collection}/${id}:`,
      error,
    );
  }
}

function buildPhysicalOrderTotals(
  orderData: ValidatedOrderData,
  physicalItems: ValidatedCartItem[],
) {
  const physicalSubtotalCents = physicalItems.reduce(
    (sum, item) => sum + item.lineTotal,
    0,
  );
  const merchVatCents = Math.round(orderData.totals.merchVat * 100);
  const shippingVatCents = Math.round(orderData.totals.shippingVat * 100);
  const shippingCents = Math.round(orderData.totals.shipping * 100);

  return {
    subtotal: physicalSubtotalCents / 100,
    shipping: orderData.totals.shipping,
    vat: (merchVatCents + shippingVatCents) / 100,
    total:
      (physicalSubtotalCents +
        shippingCents +
        merchVatCents +
        shippingVatCents) /
      100,
  };
}

function buildTicketLineRecords(ticketItems: ValidatedCartItem[]) {
  return ticketItems.map((item) => {
    const { netCents, vatCents } = splitGrossIntoNetAndVatCents(
      item.lineTotal,
      item.vatRate ?? 0,
    );
    return {
      cartItemId: item.id,
      ticketName: item.name,
      ticketDescription: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice / 100,
      lineTotal: item.lineTotal / 100,
      eventId: item.eventId || '',
      tierId: item.tierId || '',
      vatRate: item.vatRate ?? 0,
      unitNet: netCents / 100 / item.quantity,
      vatAmount: vatCents / 100,
      stripePriceId: item.stripePriceId || '',
      answerSets: toPayloadAnswerSets(item.buyerAnswerSets),
    };
  });
}

function toPayloadAnswerSets(
  sets: BuyerAnswerSet[] | undefined,
): { answers: BuyerAnswerSet }[] | undefined {
  if (!sets?.length) return undefined;
  return sets.map((answers) => ({ answers }));
}

function buildTicketTotals(ticketItems: ValidatedCartItem[]) {
  const gross =
    ticketItems.reduce((sum, item) => sum + item.lineTotal, 0) / 100;
  const { netCents, vatCents } = ticketItems.reduce(
    (totals, item) => {
      const split = splitGrossIntoNetAndVatCents(
        item.lineTotal,
        item.vatRate ?? 0,
      );
      totals.netCents += split.netCents;
      totals.vatCents += split.vatCents;
      return totals;
    },
    { netCents: 0, vatCents: 0 },
  );

  return {
    subtotal: netCents / 100,
    vat: vatCents / 100,
    total: gross,
  };
}

async function findRecord(
  payload: Payload,
  collection: 'online-orders' | 'ticket-sales',
  paymentIntentId: string,
  eventId?: string,
): Promise<any | null> {
  const where = eventId
    ? {
        and: [
          { transactionId: { equals: paymentIntentId } },
          { event: { equals: eventId } },
        ],
      }
    : { transactionId: { equals: paymentIntentId } };
  const result = await payload.find({ collection, where, limit: 1, depth: 0 });
  return result.docs[0] || null;
}

async function saleExists(
  payload: Payload,
  saleTransactionId: string,
): Promise<boolean> {
  const result = await payload.find({
    collection: 'sales',
    where: { bandcampTransactionId: { equals: saleTransactionId } },
    limit: 1,
    depth: 0,
  });
  return result.docs.length > 0;
}

async function decrementStock(
  payload: Payload,
  item: ValidatedCartItem,
): Promise<void> {
  if (!item.productId || (item.type !== 'merch' && item.type !== 'release')) {
    return;
  }
  const collection = item.type === 'merch' ? 'merch' : 'releases';
  const product: any = await payload.findByID({
    collection,
    id: item.productId,
    depth: 0,
  });
  if (typeof product.stockQuantity !== 'number') return;
  await payload.update({
    collection,
    id: item.productId,
    data: {
      stockQuantity: Math.max(0, product.stockQuantity - item.quantity),
    },
  });
}

export async function processStripeOrderSuccess(
  payload: Payload,
  paymentIntentId: string,
  orderData: ValidatedOrderData,
  detectedPaymentMethod: 'stripe' | 'paypal',
  orderNumber: string,
  options?: {
    /**
     * When true (client `/ensure-order-created` fallback), only send emails if
     * this invocation created the sale/order. Avoids duplicate "Fallback
     * Processing" emails when the Stripe webhook already handled the order.
     */
    isFallback?: boolean;
    /** Actual Stripe fee for the whole PaymentIntent, in the charge currency. */
    stripeFeeEuros?: number | null;
  },
) {
  const { ticketItems, physicalItems } = splitItems(orderData);
  const isFallback = Boolean(options?.isFallback);
  const orderCurrency = normalizeCurrency(orderData.currency);
  const paymentStripeFeeEuros =
    typeof options?.stripeFeeEuros === 'number' && options.stripeFeeEuros >= 0
      ? options.stripeFeeEuros
      : null;
  const paymentTotalEuros = orderData.totals.total;
  let createdAny = false;

  let onlineOrder =
    physicalItems.length > 0
      ? await findRecord(payload, 'online-orders', paymentIntentId)
      : null;
  let createdOnlineOrder = false;
  if (physicalItems.length > 0 && !onlineOrder) {
    const physicalTotals = buildPhysicalOrderTotals(orderData, physicalItems);
    onlineOrder = await payload.create({
      collection: 'online-orders',
      data: {
        orderNumber: `SHUSH-ORDER-${paymentIntentId}`,
        status: 'pending',
        paymentMethod: detectedPaymentMethod,
        paymentStatus: 'paid',
        transactionId: paymentIntentId,
        customerEmail: orderData.customerData.email as string,
        customerPhone: (orderData.customerData.phone as string) || '',
        firstName: orderData.customerData.firstName as string,
        lastName: orderData.customerData.lastName as string,
        shippingAddress: {
          street: (orderData.customerData.street as string) || '',
          city: (orderData.customerData.city as string) || '',
          postalCode: (orderData.customerData.postalCode as string) || '',
          country: (orderData.customerData.country as string) || '',
          shippingRegion: orderData.shippingRegion,
        },
        items: physicalItems.map((item) => ({
          product: null,
          quantity: item.quantity,
          unitPrice: item.unitPrice / 100,
          lineTotal: item.lineTotal / 100,
          cartItemId: item.id,
          cartItemName: item.name,
          cartItemDescription: item.variant
            ? `${item.description} (Variant: ${item.variant})`
            : item.description,
        })),
        orderTotals: physicalTotals,
        customerNotes: (orderData.customerData.customerNotes as string) || '',
      },
    });

    createdAny = true;
    createdOnlineOrder = true;
    console.log('✅ Created online order:', onlineOrder.id);
  }
  if (
    physicalItems.length > 0 &&
    onlineOrder &&
    shouldSendConfirmationEmail({
      isFallback,
      createdThisInvocation: createdOnlineOrder,
      alreadySent: Boolean(onlineOrder.confirmationEmailSent),
    })
  ) {
    try {
      await claimConfirmationEmailSent(
        payload,
        'online-orders',
        onlineOrder.id,
      );
      await sendOrderEmails(
        physicalItems,
        orderData,
        orderNumber,
        detectedPaymentMethod,
        paymentIntentId,
        payload,
      );
    } catch (error) {
      console.error('Failed to send physical order emails:', error);
      await releaseConfirmationEmailSent(
        payload,
        'online-orders',
        onlineOrder.id,
      );
    }
  }

  const ticketGroups = new Map<string, ValidatedCartItem[]>();
  for (const item of ticketItems) {
    const eventId = item.eventId || (item.metadata.eventId as string);
    if (!eventId) throw new Error('Validated ticket is missing its event ID');
    ticketGroups.set(eventId, [...(ticketGroups.get(eventId) || []), item]);
  }

  for (const [eventId, eventTickets] of ticketGroups) {
    let ticketSale = await findRecord(
      payload,
      'ticket-sales',
      paymentIntentId,
      eventId,
    );
    const ticketNumber = `TICKET-${paymentIntentId}-${eventId}`;
    const firstTicket = eventTickets[0];
    const eventMetadata = firstTicket.metadata || {};
    const ticketTotals = buildTicketTotals(eventTickets);

    const eventStripeFee =
      paymentStripeFeeEuros === null
        ? undefined
        : allocateStripeFeeEuros(
            paymentStripeFeeEuros,
            ticketTotals.total,
            paymentTotalEuros,
          );

    let createdTicketSale = false;
    if (!ticketSale) {
      ticketSale = await payload.create({
        collection: 'ticket-sales',
        data: {
          ticketNumber,
          status: 'active',
          event: eventId,
          ticketTier: eventTickets.map((item) => item.name).join(', '),
          paymentMethod: detectedPaymentMethod,
          paymentStatus: 'paid',
          transactionId: paymentIntentId,
          currency: orderCurrency,
          ...(typeof eventStripeFee === 'number'
            ? { stripeFee: eventStripeFee }
            : {}),
          customerEmail: orderData.customerData.email as string,
          customerPhone: (orderData.customerData.phone as string) || '',
          firstName: orderData.customerData.firstName as string,
          lastName: orderData.customerData.lastName as string,
          tickets: buildTicketLineRecords(eventTickets),
          ticketTotals,
          eventDate: (eventMetadata.eventDate as string) || null,
          eventLocation: (eventMetadata.eventLocation as string) || null,
          eventTitle:
            (eventMetadata.eventTitle as string) ||
            firstTicket.parentItem ||
            null,
          customerNotes: (orderData.customerData.customerNotes as string) || '',
        },
      });

      console.log('✅ Created ticket sale:', ticketSale.id);
      createdAny = true;
      createdTicketSale = true;
    } else if (
      typeof eventStripeFee === 'number' &&
      (typeof ticketSale.stripeFee !== 'number' || ticketSale.stripeFee <= 0)
    ) {
      ticketSale = await payload.update({
        collection: 'ticket-sales',
        id: ticketSale.id,
        data: { stripeFee: eventStripeFee },
      });
    }
    if (
      shouldSendConfirmationEmail({
        isFallback,
        createdThisInvocation: createdTicketSale,
        alreadySent: Boolean(ticketSale.confirmationEmailSent),
      })
    ) {
      try {
        await claimConfirmationEmailSent(
          payload,
          'ticket-sales',
          ticketSale.id,
        );
        await sendTicketEmails(
          eventTickets,
          orderData,
          ticketNumber,
          detectedPaymentMethod,
          paymentIntentId,
          payload,
        );
      } catch (error) {
        console.error(
          `Failed to send ticket emails for event ${eventId}:`,
          error,
        );
        await releaseConfirmationEmailSent(
          payload,
          'ticket-sales',
          ticketSale.id,
        );
      }
    }
  }

  if (physicalItems.length > 0) {
    const totalItemsValue = physicalItems.reduce(
      (sum, item) => sum + item.lineTotal,
      0,
    );
    const merchTaxRate = getMerchVatRate(orderData.shippingRegion);

    for (const item of physicalItems) {
      const saleTransactionId = `${paymentIntentId}:${item.id}`;
      if (await saleExists(payload, saleTransactionId)) continue;
      try {
        const itemProportion = item.lineTotal / totalItemsValue;
        const itemShipping = orderData.totals.shipping * itemProportion;
        const itemVAT =
          (orderData.totals.merchVat + orderData.totals.shippingVat) *
          itemProportion;

        await payload.create({
          collection: 'sales',
          data: {
            itemName: item.variant
              ? `${item.name} (${item.variant})`
              : item.name,
            type: item.type === 'release' ? 'record' : 'merch',
            pointOfSale:
              detectedPaymentMethod === 'stripe' ? 'stripe' : 'paypal',
            soldAt: new Date().toISOString(),
            itemPrice: item.unitPrice / 100,
            quantity: item.quantity,
            currency: 'EUR',
            subTotal: item.lineTotal / 100,
            shipping: itemShipping,
            sellerTax: itemVAT,
            taxRate: merchTaxRate,
            netAmount: item.lineTotal / 100 + itemShipping + itemVAT,
            buyerEmail: orderData.customerData.email as string,
            bandcampTransactionId: saleTransactionId,
            regionOrState: orderData.shippingRegion,
          },
        });
        await decrementStock(payload, item);
      } catch (saleError) {
        console.error(
          `Failed to create sale record for ${item.name}:`,
          saleError,
        );
      }
    }
  }
  return { created: createdAny };
}

async function sendOrderEmails(
  physicalItems: ValidatedCartItem[],
  orderData: ValidatedOrderData,
  orderNumber: string,
  paymentMethod: string,
  transactionId: string,
  payload: Payload,
) {
  const itemsList = physicalItems
    .map(
      (item) =>
        `• ${item.name}${item.variant ? ` (${item.variant})` : ''} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`,
    )
    .join('\n');

  const physicalSubtotal =
    physicalItems.reduce((sum, item) => sum + item.lineTotal, 0) / 100;
  const physicalTotals = buildPhysicalOrderTotals(orderData, physicalItems);
  const physicalTotal = physicalTotals.total;

  const orderSummary = `
Order Number: ${orderNumber}
Customer: ${orderData.customerData.firstName} ${orderData.customerData.lastName}
Email: ${orderData.customerData.email}

Items:
${itemsList}

Subtotal: €${physicalSubtotal.toFixed(2)}
Shipping: €${physicalTotals.shipping.toFixed(2)}
VAT: €${physicalTotals.vat.toFixed(2)}
Total: €${physicalTotal.toFixed(2)}

Shipping Address:
${orderData.customerData.firstName} ${orderData.customerData.lastName}
${orderData.customerData.street}
${orderData.customerData.city}, ${orderData.customerData.postalCode}
${orderData.customerData.country}
  `;

  await payload.sendEmail({
    to: orderData.customerData.email as string,
    from: `SHUSH <${process.env.SMTP_USER}>`,
    replyTo: 'SHUSH <hello@shush.dance>',
    subject: `Order Confirmation - ${orderNumber}`,
    html: `
      <h2>Thank you for your order!</h2>
      <p>Hi ${orderData.customerData.firstName},</p>
      <p>We've received your order and it's being processed. Here are the details:</p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${orderSummary}</pre>
      ${
        physicalItems.some((item) => !item.isDigital)
          ? "<p>We'll notify you by email when your order is shipped.</p>"
          : '<p>Your digital order has been received.</p>'
      }
      <p>Thanks for supporting us and what we do!</p>
      <p>- SHUSH crew</p>
    `,
  });

  await payload.sendEmail({
    to: 'hello@shush.dance',
    from: `SHUSH <${process.env.SMTP_USER}>`,
    replyTo: 'SHUSH <hello@shush.dance>',
    subject: `New Order - ${orderNumber}`,
    html: `
      <h2>New Order Received</h2>
      <p>A new order has been placed:</p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${orderSummary}</pre>
      <p>Payment Method: ${paymentMethod}</p>
      <p>Transaction ID: ${transactionId}</p>
    `,
  });
}

async function sendTicketEmails(
  ticketItems: ValidatedCartItem[],
  orderData: ValidatedOrderData,
  ticketNumber: string,
  paymentMethod: string,
  transactionId: string,
  payload: Payload,
) {
  const ticketsList = ticketItems
    .map((item) => {
      const base = `• ${item.name} - Quantity: ${item.quantity} - €${(item.lineTotal / 100).toFixed(2)}`;
      const details = formatBuyerAnswerSetsForDisplay(item.buyerAnswerSets);
      return details ? `${base}\n  ${details}` : base;
    })
    .join('\n');

  const ticketTotals = buildTicketTotals(ticketItems);

  const ticketSummary = `
Ticket Number: ${ticketNumber}
Customer: ${orderData.customerData.firstName} ${orderData.customerData.lastName}
Email: ${orderData.customerData.email}
Event: ${ticketItems[0]?.parentItem || 'Event TBA'}

Tickets:
${ticketsList}

Subtotal (excl. VAT): €${ticketTotals.subtotal.toFixed(2)}
VAT (included): €${ticketTotals.vat.toFixed(2)}
Total: €${ticketTotals.total.toFixed(2)}
Payment Method: ${paymentMethod}
Transaction ID: ${transactionId}
  `;

  const eventFooterHtml = await fetchEventFooterHtml(
    { payload },
    ticketItems[0]?.metadata?.eventId as string | undefined,
  );

  await payload.sendEmail({
    to: orderData.customerData.email as string,
    from: `SHUSH <${process.env.SMTP_USER}>`,
    replyTo: 'SHUSH <hello@shush.dance>',
    subject: `Ticket Confirmation - ${ticketNumber}`,
    html: `
      <h2>SHUSH - Ticket Purchase Confirmation</h2>
      <p>Hi ${orderData.customerData.firstName},</p>
      <p>Thank you for purchasing tickets! Here are your ticket details:</p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${ticketSummary}</pre>
      <p><strong>Important:</strong></p>
      <ul>
        <li>Save this email as your ticket confirmation</li>
        <li>Your name will be added to a list at the door</li>
        <li>Be mindful and respectful of the venue and other attendees</li>
      </ul>
      <p>Thanks for supporting us and what we do. See you on the dance!</p>
      <p>- SHUSH crew</p>
      ${renderEventFooterSection(eventFooterHtml)}
    `,
  });

  await payload.sendEmail({
    to: 'events@shush.dance',
    from: `SHUSH <${process.env.SMTP_USER}>`,
    replyTo: 'SHUSH <hello@shush.dance>',
    subject: `New Ticket Sale - ${ticketNumber}`,
    html: `
      <h2>New Ticket Sale</h2>
      <p>New tickets have been sold:</p>
      <pre style="background: #f5f5f5; padding: 15px; border-radius: 5px; font-family: monospace;">${ticketSummary}</pre>
    `,
  });
}
