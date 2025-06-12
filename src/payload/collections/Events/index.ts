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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Event Flyer',
      required: false,
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
          name: 'stripePriceId',
          type: 'text',
          label: 'Stripe Price ID',
          required: true,
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
