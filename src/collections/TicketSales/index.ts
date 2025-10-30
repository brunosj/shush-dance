import type { CollectionConfig } from 'payload/types';
import { admins } from '../../access/admins';

export const TicketSales: CollectionConfig = {
  slug: 'ticket-sales',
  labels: {
    singular: 'Ticket Sale',
    plural: 'Ticket Sales',
  },
  admin: {
    useAsTitle: 'ticketNumber',
    defaultColumns: [
      'ticketNumber',
      'customerEmail',
      'event',
      'ticketTier',
      'total',
      'status',
      'createdAt',
    ],
  },
  access: {
    read: admins,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Ticket Details',
          fields: [
            {
              name: 'ticketNumber',
              type: 'text',
              label: 'Ticket Number',
              required: true,
              unique: true,
              admin: {
                description: 'Auto-generated unique ticket number',
              },
            },
            {
              name: 'status',
              type: 'select',
              label: 'Ticket Status',
              required: true,
              defaultValue: 'active',
              options: [
                { label: 'Active', value: 'active' },
                { label: 'Used', value: 'used' },
                { label: 'Cancelled', value: 'cancelled' },
                { label: 'Refunded', value: 'refunded' },
              ],
            },
            {
              name: 'event',
              type: 'relationship',
              relationTo: 'events',
              label: 'Event',
              required: false, // Made optional since we might not have event ID during checkout
              admin: {
                description:
                  'The event this ticket is for (can be set manually later)',
              },
            },
            {
              name: 'ticketTier',
              type: 'text',
              label: 'Ticket Tier',
              required: true,
              admin: {
                description: 'The tier/type of ticket purchased',
              },
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'paymentMethod',
                  type: 'select',
                  label: 'Payment Method',
                  required: true,
                  options: [
                    { label: 'Stripe', value: 'stripe' },
                    { label: 'PayPal', value: 'paypal' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'paymentStatus',
                  type: 'select',
                  label: 'Payment Status',
                  required: true,
                  defaultValue: 'pending',
                  options: [
                    { label: 'Pending', value: 'pending' },
                    { label: 'Paid', value: 'paid' },
                    { label: 'Failed', value: 'failed' },
                    { label: 'Refunded', value: 'refunded' },
                  ],
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              name: 'transactionId',
              type: 'text',
              label: 'Transaction ID',
              admin: {
                description: 'Payment processor transaction ID',
              },
            },
          ],
        },
        {
          label: 'Customer Info',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'customerEmail',
                  type: 'email',
                  label: 'Email',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'customerPhone',
                  type: 'text',
                  label: 'Phone',
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'firstName',
                  type: 'text',
                  label: 'First Name',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
                {
                  name: 'lastName',
                  type: 'text',
                  label: 'Last Name',
                  required: true,
                  admin: {
                    width: '50%',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Ticket Items',
          fields: [
            {
              name: 'tickets',
              type: 'array',
              label: 'Tickets',
              required: true,
              fields: [
                {
                  name: 'cartItemId',
                  type: 'text',
                  label: 'Cart Item ID',
                  admin: {
                    description: 'Original cart item identifier',
                  },
                },
                {
                  name: 'ticketName',
                  type: 'text',
                  label: 'Ticket Name',
                  required: true,
                  admin: {
                    description: 'Name of the ticket from cart',
                  },
                },
                {
                  name: 'ticketDescription',
                  type: 'text',
                  label: 'Ticket Description',
                  admin: {
                    description: 'Description of the ticket from cart',
                  },
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'quantity',
                      type: 'number',
                      label: 'Quantity',
                      required: true,
                      min: 1,
                      admin: {
                        width: '33%',
                      },
                    },
                    {
                      name: 'unitPrice',
                      type: 'number',
                      label: 'Unit Price (EUR)',
                      required: true,
                      admin: {
                        width: '33%',
                        step: 0.01,
                      },
                    },
                    {
                      name: 'lineTotal',
                      type: 'number',
                      label: 'Line Total (EUR)',
                      required: true,
                      admin: {
                        width: '34%',
                        step: 0.01,
                      },
                    },
                  ],
                },
                {
                  name: 'stripePriceId',
                  type: 'text',
                  label: 'Stripe Price ID',
                  admin: {
                    description: 'Stripe price ID used for this ticket',
                  },
                },
              ],
            },
            {
              name: 'ticketTotals',
              type: 'group',
              label: 'Ticket Totals',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'subtotal',
                      type: 'number',
                      label: 'Subtotal (excl. VAT)',
                      required: true,
                      admin: {
                        width: '33%',
                        step: 0.01,
                      },
                    },
                    {
                      name: 'vat',
                      type: 'number',
                      label: 'VAT',
                      required: true,
                      admin: {
                        width: '33%',
                        step: 0.01,
                      },
                    },
                    {
                      name: 'total',
                      type: 'number',
                      label: 'Total',
                      required: true,
                      admin: {
                        width: '34%',
                        step: 0.01,
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Event Details',
          fields: [
            {
              name: 'eventDate',
              type: 'date',
              label: 'Event Date',
              admin: {
                description: 'Date of the event (copied from event)',
              },
            },
            {
              name: 'eventLocation',
              type: 'text',
              label: 'Event Location',
              admin: {
                description: 'Location of the event (copied from event)',
              },
            },
            {
              name: 'eventTitle',
              type: 'text',
              label: 'Event Title',
              admin: {
                description: 'Title of the event (copied from event)',
              },
            },
          ],
        },
        {
          label: 'Notes',
          fields: [
            {
              name: 'customerNotes',
              type: 'textarea',
              label: 'Customer Notes',
            },
            {
              name: 'internalNotes',
              type: 'textarea',
              label: 'Internal Notes',
              admin: {
                description: 'Internal notes (not visible to customer)',
              },
            },
          ],
        },
      ],
    },
  ],
};
