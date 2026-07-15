import type { CollectionConfig } from 'payload/types';
import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';
import { slugField } from '../../fields/slug';
import { createRichTextField } from '../../fields/createRichTextField';

export const Events: CollectionConfig = {
  slug: 'events',
  admin: {
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
                      label: 'Price (EUR, incl. VAT)',
                      required: true,
                      min: 0.01,
                      admin: {
                        description:
                          'Final customer-facing ticket price in euros, VAT included.',
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
                          'VAT rate included in the price above. Defaults to 7% for event tickets.',
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
                  name: 'stripePriceId',
                  type: 'text',
                  label: 'Stripe Price ID (legacy)',
                  required: false,
                  admin: {
                    hidden: true,
                    description:
                      'Optional legacy Stripe Price ID for historical Payment Link backfill.',
                  },
                },
                {
                  name: 'ticketLink',
                  type: 'text',
                  label: 'Ticket Link (legacy)',
                  required: false,
                  admin: {
                    hidden: true,
                    description: 'Optional legacy Stripe Payment Link URL.',
                  },
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
              label: 'Stripe catalog match key (legacy)',
              required: false,
              admin: {
                hidden: true,
                description:
                  'Legacy field for Stripe Payment Link backfill only. Not required for onsite checkout.',
              },
            },
          ],
        },
      ],
    },
  ],
};
