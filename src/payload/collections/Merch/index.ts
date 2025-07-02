import type { CollectionConfig } from 'payload/types';
import { createRichTextField } from '../../fields/createRichTextField';
import { slugField } from '../../fields/slug';
import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';

export const Merch: CollectionConfig = {
  slug: 'merch',
  labels: {
    singular: 'Merch Item',
    plural: 'Merch Items',
  },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'itemType', 'price', 'updatedAt'],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: adminsOrPublished,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      type: 'tabs',
      tabs: [
        {
          label: 'Info',
          fields: [
            {
              name: 'title',
              type: 'text',
              label: 'Title',
              required: true,
            },
            {
              name: 'itemType',
              type: 'select',
              label: 'Item Type',
              required: true,
              options: [
                { label: 'Clothing', value: 'clothing' },
                { label: 'Prints', value: 'prints' },
                { label: 'Other', value: 'other' },
              ],
            },
            createRichTextField({
              label: 'Description',
            }),
            slugField('title'),
          ],
        },
        {
          label: 'Shipping',
          fields: [
            {
              name: 'price',
              type: 'number',
              label: 'Price (EUR)',
              required: true,
              min: 0,
              admin: {
                description: 'Price in EUR (without VAT)',
              },
            },
            {
              name: 'shippingPrices',
              type: 'group',
              label: 'Shipping Prices (EUR)',
              fields: [
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'germany',
                      type: 'number',
                      label: 'Germany - First Item',
                      required: true,
                      min: 0,
                      defaultValue: 0,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'germanyAdditional',
                      type: 'number',
                      label: 'Germany - Each Additional',
                      required: true,
                      min: 0,
                      defaultValue: 0,
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
                      name: 'eu',
                      type: 'number',
                      label: 'EU - First Item',
                      required: true,
                      min: 0,
                      defaultValue: 0,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'euAdditional',
                      type: 'number',
                      label: 'EU - Each Additional',
                      required: true,
                      min: 0,
                      defaultValue: 0,
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
                      name: 'restOfWorld',
                      type: 'number',
                      label: 'Rest of World - First Item',
                      required: true,
                      min: 0,
                      defaultValue: 0,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'restOfWorldAdditional',
                      type: 'number',
                      label: 'Rest of World - Each Additional',
                      required: true,
                      min: 0,
                      defaultValue: 0,
                      admin: {
                        width: '50%',
                      },
                    },
                  ],
                },
              ],
            },
            {
              type: 'row',
              fields: [
                {
                  name: 'stockQuantity',
                  type: 'number',
                  label: 'Stock Quantity',
                  required: false,
                  min: 0,
                  admin: {
                    width: '33%',
                    description: 'Leave empty for unlimited stock',
                  },
                },
                {
                  name: 'isDigital',
                  type: 'checkbox',
                  label: 'Digital Product',
                  defaultValue: false,
                  admin: {
                    width: '33%',
                    description:
                      'Check if this is a digital product (no shipping required)',
                  },
                },
              ],
            },
          ],
        },
        {
          label: 'Images',
          fields: [
            {
              name: 'mainImage',
              type: 'upload',
              relationTo: 'media',
              label: 'Main Image',
              required: true,
            },
            {
              name: 'images',
              type: 'array',
              label: 'Additional Images',
              fields: [
                {
                  name: 'image',
                  type: 'upload',
                  relationTo: 'media',
                  label: 'Image',
                  required: false,
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};
