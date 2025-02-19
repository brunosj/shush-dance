import { CollectionConfig } from 'payload/types';
import { SyncBandcampButton } from '../../components/SyncBandcampButton';
import { admins } from '../../access/admins';

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

    components: {
      BeforeList: [SyncBandcampButton],
    },
  },
  access: {
    read: admins,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'itemName',
          type: 'text',
          required: true,
          admin: { width: '50%' },
        },
        {
          name: 'artist',
          type: 'text',
          admin: { width: '50%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'itemType',
          type: 'text',
          admin: { width: '25%' },
        },
        {
          name: 'package',
          type: 'text',
          admin: { width: '25%' },
        },
        {
          name: 'option',
          type: 'text',
          admin: { width: '25%' },
        },
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Record', value: 'record' },
            { label: 'Merch', value: 'merch' },
            { label: 'Digital', value: 'digital' },
            { label: 'Track', value: 'track' },
            { label: 'Album', value: 'album' },
            { label: 'Package', value: 'package' },
          ],
          required: true,
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'itemPrice',
          type: 'number',
          admin: { width: '25%' },
        },
        {
          name: 'quantity',
          type: 'number',
          admin: { width: '25%' },
        },
        {
          name: 'subTotal',
          type: 'number',
          admin: { width: '25%' },
        },
        {
          name: 'currency',
          type: 'text',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'additionalFanContribution',
          type: 'number',
          admin: { width: '33%' },
        },
        {
          name: 'itemTotal',
          type: 'number',
          admin: { width: '33%' },
        },
        {
          name: 'netAmount',
          type: 'number',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'transactionFee',
          type: 'number',
          admin: { width: '33%' },
        },
        {
          name: 'feeType',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'amountYouReceived',
          type: 'number',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'sellerTax',
          type: 'number',
          admin: { width: '25%' },
        },
        {
          name: 'marketplaceTax',
          type: 'number',
          admin: { width: '25%' },
        },
        {
          name: 'taxRate',
          type: 'number',
          admin: { width: '25%' },
        },
        {
          name: 'shipping',
          type: 'number',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'buyerName',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'buyerEmail',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'buyerPhone',
          type: 'text',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'city',
          type: 'text',
          admin: { width: '25%' },
        },
        {
          name: 'regionOrState',
          type: 'text',
          admin: { width: '25%' },
        },
        {
          name: 'country',
          type: 'text',
          admin: { width: '25%' },
        },
        {
          name: 'countryCode',
          type: 'text',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'bandcampTransactionId',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'bandcampTransactionItemId',
          type: 'text',
          required: true,
          admin: { width: '33%' },
        },
        {
          name: 'bandcampRelatedTransactionId',
          type: 'text',
          admin: { width: '33%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'itemUrl',
          type: 'text',
          admin: { width: '50%' },
        },
        {
          name: 'referer',
          type: 'text',
          admin: { width: '25%' },
        },
        {
          name: 'refererUrl',
          type: 'text',
          admin: { width: '25%' },
        },
      ],
    },
    {
      type: 'row',
      fields: [
        {
          name: 'catalogNumber',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'upc',
          type: 'text',
          admin: { width: '33%' },
        },
        {
          name: 'isrc',
          type: 'text',
          admin: { width: '33%' },
        },
      ],
    },
    {
      name: 'buyerNote',
      type: 'textarea',
    },
    {
      name: 'soldAt',
      type: 'date',
    },
  ],
  timestamps: true,
};
