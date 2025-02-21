import { CollectionConfig } from 'payload/types';
import { SyncBandcampButton } from '../../components/SyncBandcampButton';
import { admins } from '../../access/admins';
import { anyone } from '../../access/anyone';

export const Sales: CollectionConfig = {
  slug: 'sales',

  admin: {
    useAsTitle: 'itemName',
    defaultColumns: ['itemName', 'type', 'amount', 'pointOfSale', 'soldAt'],
    components: {
      BeforeListTable: [SyncBandcampButton],
    },
  },

  access: {
    read: ({ req: { user } }) => {
      return Boolean(user);
    },
    update: admins,
    create: admins,
    delete: admins,
  },

  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Basic Information',
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
                  name: 'pointOfSale',
                  type: 'select',
                  options: [
                    { label: 'Bandcamp', value: 'bandcamp' },
                    { label: 'PayPal', value: 'paypal' },
                    { label: 'In-Person', value: 'in-person' },
                    { label: 'Promo', value: 'promo' },
                  ],
                  required: true,
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
              ],
            },
            {
              name: 'soldAt',
              type: 'date',
              required: true,
            },
          ],
        },
        {
          label: 'Financial Details',
          fields: [
            {
              type: 'row',
              fields: [
                {
                  name: 'itemPrice',
                  type: 'number',
                  admin: {
                    width: '33%',
                    step: 0.01,
                    description: 'Base price per item',
                  },
                },
                {
                  name: 'quantity',
                  type: 'number',
                  admin: {
                    width: '33%',
                    step: 1,
                    description: 'Number of items sold',
                  },
                },
                {
                  name: 'currency',
                  type: 'text',
                  admin: {
                    width: '33%',
                    description: 'Currency code (e.g., EUR, USD)',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'subTotal',
                  type: 'number',
                  admin: {
                    width: '50%',
                    step: 0.01,
                    description: 'Price × Quantity',
                  },
                },
                {
                  name: 'additionalFanContribution',
                  type: 'number',
                  admin: {
                    width: '50%',
                    step: 0.01,
                    description: 'Extra amount paid by customer',
                  },
                },
              ],
            },

            {
              type: 'row',
              fields: [
                {
                  name: 'sellerTax',
                  type: 'number',
                  admin: {
                    width: '25%',
                    step: 0.01,
                    description: 'Tax paid by seller',
                  },
                },
                {
                  name: 'marketplaceTax',
                  type: 'number',
                  admin: {
                    width: '25%',
                    step: 0.01,
                    description: 'Tax paid to marketplace',
                  },
                },
                {
                  name: 'taxRate',
                  type: 'number',
                  admin: {
                    width: '25%',
                    step: 0.01,
                    description: 'Applicable tax rate',
                  },
                },
                {
                  name: 'shipping',
                  type: 'number',
                  admin: {
                    width: '25%',
                    step: 0.01,
                    description: 'Shipping cost',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'itemTotal',
                  type: 'number',
                  admin: {
                    width: '100%',
                    step: 0.01,
                    description:
                      'Subtotal + Additional contribution (Amount received)',
                  },
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'transactionFee',
                  type: 'number',
                  admin: {
                    width: '33%',
                    step: 0.01,
                    description: 'Platform fee',
                  },
                },
                {
                  name: 'feeType',
                  type: 'text',
                  admin: {
                    width: '33%',
                    description: 'Type of fee charged',
                  },
                },
                {
                  name: 'netAmount',
                  type: 'number',
                  admin: {
                    width: '33%',
                    step: 0.01,
                    description: 'Total after fees and taxes',
                    style: {
                      color: 'green',
                    },
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Customer Information',
          fields: [
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
              name: 'buyerNote',
              type: 'textarea',
            },
          ],
        },
        {
          label: 'Platform Details',
          fields: [
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
          ],
        },
        {
          label: 'Catalog Information',
          fields: [
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
          ],
        },
      ],
    },
  ],
  timestamps: true,
};
