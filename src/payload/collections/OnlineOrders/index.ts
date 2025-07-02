import type { CollectionConfig } from 'payload/types';
import { admins } from '../../access/admins';

export const OnlineOrders: CollectionConfig = {
  slug: 'online-orders',
  labels: {
    singular: 'Online Order',
    plural: 'Online Orders',
  },
  admin: {
    useAsTitle: 'orderNumber',
    defaultColumns: [
      'orderNumber',
      'customerEmail',
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
          label: 'Order Details',
          fields: [
            {
              name: 'orderNumber',
              type: 'text',
              label: 'Order Number',
              required: true,
              unique: true,
              admin: {
                description: 'Auto-generated unique order number',
              },
            },
            {
              name: 'status',
              type: 'select',
              label: 'Order Status',
              required: true,
              defaultValue: 'pending',
              options: [
                { label: 'Pending', value: 'pending' },
                { label: 'Processing', value: 'processing' },
                { label: 'Shipped', value: 'shipped' },
                { label: 'Delivered', value: 'delivered' },
                { label: 'Cancelled', value: 'cancelled' },
              ],
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
            {
              name: 'shippingAddress',
              type: 'group',
              label: 'Shipping Address',
              fields: [
                {
                  name: 'street',
                  type: 'text',
                  label: 'Street Address',
                  required: true,
                },
                {
                  type: 'row',
                  fields: [
                    {
                      name: 'city',
                      type: 'text',
                      label: 'City',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'postalCode',
                      type: 'text',
                      label: 'Postal Code',
                      required: true,
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
                      name: 'country',
                      type: 'text',
                      label: 'Country',
                      required: true,
                      admin: {
                        width: '50%',
                      },
                    },
                    {
                      name: 'shippingRegion',
                      type: 'select',
                      label: 'Shipping Region',
                      required: true,
                      options: [
                        { label: 'Germany', value: 'germany' },
                        { label: 'European Union', value: 'eu' },
                        { label: 'Rest of World', value: 'restOfWorld' },
                      ],
                      admin: {
                        width: '50%',
                      },
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: 'Order Items',
          fields: [
            {
              name: 'items',
              type: 'array',
              label: 'Order Items',
              required: true,
              fields: [
                {
                  name: 'product',
                  type: 'relationship',
                  relationTo: ['releases', 'merch'],
                  label: 'Product',
                  required: false,
                  admin: {
                    description: 'Optional: Link to CMS product if available',
                  },
                },
                {
                  name: 'cartItemId',
                  type: 'text',
                  label: 'Cart Item ID',
                  admin: {
                    description: 'Original cart item identifier',
                  },
                },
                {
                  name: 'cartItemName',
                  type: 'text',
                  label: 'Item Name',
                  admin: {
                    description: 'Product name from cart',
                  },
                },
                {
                  name: 'cartItemDescription',
                  type: 'text',
                  label: 'Item Description',
                  admin: {
                    description: 'Product description from cart',
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
              ],
            },
            {
              name: 'orderTotals',
              type: 'group',
              label: 'Order Totals',
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
                        width: '25%',
                        step: 0.01,
                      },
                    },
                    {
                      name: 'shipping',
                      type: 'number',
                      label: 'Shipping',
                      required: true,
                      admin: {
                        width: '25%',
                        step: 0.01,
                      },
                    },
                    {
                      name: 'vat',
                      type: 'number',
                      label: 'VAT',
                      required: true,
                      admin: {
                        width: '25%',
                        step: 0.01,
                      },
                    },
                    {
                      name: 'total',
                      type: 'number',
                      label: 'Total',
                      required: true,
                      admin: {
                        width: '25%',
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
