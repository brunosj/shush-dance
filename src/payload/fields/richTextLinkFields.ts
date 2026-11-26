import type { Field } from 'payload';

export const linkFields: Field[] = [
  {
    name: 'linkType',
    type: 'radio',
    options: [
      { label: 'Internal link', value: 'internal' },
      { label: 'Custom URL', value: 'custom' },
    ],
    admin: {
      layout: 'horizontal',
    },
  },
  {
    name: 'url',
    type: 'text',
    admin: {
      condition: (_, siblingData) => siblingData?.linkType === 'custom',
    },
    label: 'Custom URL',
  },
  {
    name: 'doc',
    type: 'relationship',
    relationTo: ['pages', 'documents'],
    admin: {
      condition: (_, siblingData) => siblingData?.linkType === 'internal',
    },
    label: 'Document to link to',
  },
  {
    name: 'newTab',
    type: 'checkbox',
    label: 'Open in new tab',
  },
];