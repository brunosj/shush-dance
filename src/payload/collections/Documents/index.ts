import type { CollectionConfig } from 'payload/types';

import { getDocumentsUploadDir } from '../../paths';

export const Documents: CollectionConfig = {
  slug: 'documents',
  labels: {
    singular: 'Document',
    plural: 'Documents',
  },
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'filename', 'updatedAt'],
  },
  upload: {
    staticURL: '/media/documents',
    staticDir: getDocumentsUploadDir(),
    mimeTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'application/zip',
    ],
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Title',
      admin: {
        description:
          'Shown in the admin and when picking this document in links.',
      },
    },
  ],
};

export default Documents;
