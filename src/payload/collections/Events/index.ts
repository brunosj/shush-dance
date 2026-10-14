import type { CollectionConfig } from 'payload/types';
import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';
import { slugField } from '../../fields/slug';
import { createRichTextField } from '../../fields/createRichTextField';

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
    group: 'Events',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
  },
  access: {
    read: () => true,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Details',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Event Title',
              required: true,
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'date',
                  type: 'date',
                  label: 'Event Date',
                  required: true,
                  admin: { width: '33%' },
                },
                {
                  name: 'time',
                  type: 'text',
                  label: 'Event Time',
                  required: false,
                  admin: { width: '33%' },
                },
                {
                  name: 'location',
                  type: 'text',
                  label: 'Event Location',
                  required: true,
                  admin: { width: '34%' },
                },
              ],
            },
            {
              name: 'artists',
              type: 'relationship',
              relationTo: 'artists',
              label: 'Artists',
              hasMany: true,
            },
            {
              name: 'currency',
              type: 'select',
              label: 'Currency',
              required: true,
              defaultValue: 'EUR',
              options: [
                { label: 'EUR (€)', value: 'EUR' },
                { label: 'GBP (£)', value: 'GBP' },
              ],
              admin: {
                description:
                  'Ticket prices and Stripe charges use this currency. Merch/releases remain EUR — do not mix currencies in one cart.',
              },
            },
            slugField(),
          ],
        },
        {
          label: 'Content',
          fields: [
            createRichTextField({
              label: 'Event Information',
            }),
            {
              name: 'images',
              type: 'array',
              label: 'Event Flyers',
              required: false,
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  required: true,
                },
              ],
            },
            {
              name: 'image',
              type: 'upload',
              relationTo: 'media',
              label: 'Legacy Event Flyer (single)',
              required: false,
              admin: {
                hidden: true,
                description: 'Legacy single-image field. Use Event Flyers instead.',
              },
            },
          ],
        },
        {
          label: 'Tickets',
          fields: [
            {
              name: 'ticketsAvailable',
              type: 'checkbox',
              label: 'Tickets Available',
              defaultValue: true,
            },
            {
              name: 'ticketTiers',
              type: 'array',
              label: 'Ticket Tiers',
              admin: {
                condition: (data) => data.ticketsAvailable === true,
              },
              fields: [
                {
                  name: 'tierName',
                  type: 'text',
                  label: 'Tier Name',
                  required: true,
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'price',
                      type: 'number',
                      label: 'Price (incl. VAT)',
                      required: true,
                      min: 0.01,
                      admin: {
                        description:
                          'Final customer-facing ticket price in the event currency, VAT included.',
                        step: 0.01,
                        width: '50%',
                      },
                    },
                    {
                      name: 'vatRate',
                      type: 'number',
                      label: 'VAT rate (%)',
                      defaultValue: 7,
                      min: 0,
                      max: 100,
                      admin: {
                        description:
                          'VAT rate included in the price above. Defaults to 7%. Override for UK events (e.g. 20% or 0%) as needed.',
                        step: 0.01,
                        width: '50%',
                      },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'visible',
                      type: 'checkbox',
                      label: 'Visible',
                      defaultValue: true,
                      admin: { width: '50%' },
                    },
                    {
                      name: 'strikeThrough',
                      type: 'checkbox',
                      label: 'Strike Through',
                      defaultValue: false,
                      admin: { width: '50%' },
                    },
                  ],
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'stripePriceId',
                      type: 'text',
                      label: 'Stripe Price ID',
                      required: false,
                      admin: {
                        width: '50%',
                        description:
                          'For tickets sold via Stripe Payment Links / Checkout (not the onsite cart). Paste the Price ID (price_…). Sync from Stripe on the dashboard uses this to count those sales.',
                      },
                    },
                    {
                      name: 'ticketLink',
                      type: 'text',
                      label: 'Ticket / Payment Link URL',
                      required: false,
                      admin: {
                        width: '50%',
                        description:
                          'Optional reference URL for this tier’s Payment Link. Sync matches on Stripe Price ID above, not this URL.',
                      },
                    },
                  ],
                },
              ],
            },
            {
              ...createRichTextField({
                label: 'Ticket Email Footer',
              }),
              admin: {
                description:
                  'Optional content appended to ticket confirmation emails below the SHUSH crew signature.',
                condition: (data) => data.ticketsAvailable === true,
              },
            },
            {
              name: 'stripeCatalogMatchKey',
              type: 'text',
              label: 'Stripe catalog match key',
              required: false,
              admin: {
                description:
                  'Optional fallback for Payment Link sync when a Price ID is missing. Must match Stripe Price/Product metadata cms_event_key or cms_catalog_key. Not needed for onsite checkout.',
                condition: (data) => data.ticketsAvailable === true,
              },
            },
          ],
        },
      ],
    },
  ],
};
