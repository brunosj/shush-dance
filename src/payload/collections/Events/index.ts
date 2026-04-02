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
      name: 'title',
      type: 'text',
      label: 'Event Title',
      required: true,
    },
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
        description: 'Prefer using Event Flyers (multiple).',
      },
    },
    {
      name: 'date',
      type: 'date',
      label: 'Event Date',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'time',
      type: 'text',
      label: 'Event Time',
      required: false,
      admin: { position: 'sidebar' },
    },
    {
      name: 'location',
      type: 'text',
      label: 'Event Location',
      required: true,
      admin: { position: 'sidebar' },
    },
    {
      name: 'artists',
      type: 'relationship',
      relationTo: 'artists',
      label: 'Artists',
      hasMany: true,
    },
    {
      name: 'ticketsAvailable',
      type: 'checkbox',
      label: 'Tickets Available',
      defaultValue: true,
    },
    {
      name: 'stripeCatalogMatchKey',
      type: 'text',
      label: 'Stripe catalog match key',
      required: false,
      admin: {
        position: 'sidebar',
        description:
          'Optional. Set the same value in Stripe as metadata **cms_event_key** on each Price or Product used by Payment Links. Use a unique value per event. Also set **cms_tier_name** on each Stripe Price to match that tier’s **Tier Name** here (exact text, case-insensitive) so sync maps the correct tier. Alternatively use **payload_event_id** on the Price/Product for a direct event link.',
      },
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
          name: 'price',
          type: 'text',
          label: 'Price',
          required: true,
        },
        {
          name: 'visible',
          type: 'checkbox',
          label: 'Visible',
          defaultValue: true,
        },
        {
          name: 'strikeThrough',
          type: 'checkbox',
          label: 'Strike Through',
          defaultValue: false,
        },
        {
          name: 'stripePriceId',
          type: 'text',
          label: 'Stripe Price ID',
          required: true,
          admin: {
            description:
              'For Payment Links: you can set Price metadata **cms_tier_name** in Stripe to this tier’s **Tier Name** (exact match, case-insensitive). Sync then maps the line to this tier even when the Stripe product name differs.',
          },
        },
        {
          name: 'ticketLink',
          type: 'text',
          label: 'Ticket Link',
          required: false,
        },
      ],
    },
    slugField(),
  ],
};
