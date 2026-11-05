import type { CollectionConfig } from 'payload/types';

import { admins } from '../../access/admins';
import { createRichTextField } from '../../fields/createRichTextField';
import { slugField } from '../../fields/slug';

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
                description:
                  'Legacy single-image field. Use Event Flyers instead.',
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
                  name: 'buyerQuestions',
                  type: 'array',
                  label: 'Checkout questions (onsite cart)',
                  admin: {
                    description:
                      'Optional questions asked at checkout, once per ticket unit (e.g. meal choice, allergies). Not used for Payment Links.',
                  },
                  fields: [
                    {
                      name: 'key',
                      type: 'text',
                      label: 'Field key',
                      required: true,
                      admin: {
                        description: 'Stable id, e.g. meal or allergies',
                      },
                    },
                    {
                      name: 'label',
                      type: 'text',
                      label: 'Label',
                      required: true,
                    },
                    {
                      type: 'row',
                      fields: [
                        {
                          name: 'type',
                          type: 'select',
                          label: 'Type',
                          required: true,
                          defaultValue: 'select',
                          options: [
                            { label: 'Select', value: 'select' },
                            { label: 'Short text', value: 'text' },
                            { label: 'Long text', value: 'textarea' },
                          ],
                          admin: { width: '50%' },
                        },
                        {
                          name: 'required',
                          type: 'checkbox',
                          label: 'Required',
                          defaultValue: true,
                          admin: { width: '50%' },
                        },
                      ],
                    },
                    {
                      name: 'options',
                      type: 'array',
                      label: 'Select options',
                      admin: {
                        condition: (_, siblingData) =>
                          siblingData?.type === 'select',
                      },
                      fields: [
                        {
                          name: 'value',
                          type: 'text',
                          required: true,
                        },
                      ],
                    },
                    {
                      name: 'helpText',
                      type: 'text',
                      label: 'Help text',
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
                          'For Payment Link / Checkout sales (not onsite cart). Paste the Stripe Price ID (price_…) — not prod_… or plink_…. Sync from Stripe matches this.',
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
                  'Optional fallback only. Prefer Stripe Price ID on each tier. If you paste a price_… / prod_… here it will also match, but the tier field is the right place. Metadata keys cms_event_key / cms_catalog_key still work too.',
                condition: (data) => data.ticketsAvailable === true,
              },
            },
          ],
        },
      ],
    },
  ],
};
