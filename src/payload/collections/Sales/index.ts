import { CollectionConfig } from 'payload/types';

export const Sales: CollectionConfig = {
  slug: 'sales',
  admin: {
    useAsTitle: 'itemName',
    defaultColumns: [
      'itemName',
      'type',
      'amount',
      'bandName',
      'soldAt',
      'platform',
    ],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'bandId',
      type: 'number',
      required: true,
    },
    {
      name: 'bandName',
      type: 'text',
      required: true,
    },
    {
      name: 'bandSubdomain',
      type: 'text',
      required: true,
    },
    {
      name: 'itemName',
      type: 'text',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      options: [
        { label: 'Record', value: 'record' },
        { label: 'Merch', value: 'merch' },
        { label: 'Digital', value: 'digital' },
      ],
      required: true,
    },
    {
      name: 'amount',
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'text',
      defaultValue: 'EUR',
    },
    {
      name: 'soldAt',
      type: 'date',
      required: true,
    },
    {
      name: 'platform',
      type: 'select',
      options: [
        { label: 'Bandcamp', value: 'bandcamp' },
        { label: 'Manual Entry', value: 'manual' },
      ],
      required: true,
    },
    {
      name: 'bandcampOrderId',
      type: 'text',
      admin: {
        condition: (data) => data.platform === 'bandcamp',
      },
    },
    {
      name: 'customerLocation',
      type: 'text',
    },
    {
      name: 'notes',
      type: 'textarea',
    },
  ],
  timestamps: true,
};
