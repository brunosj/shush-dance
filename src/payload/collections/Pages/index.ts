import type { CollectionConfig } from 'payload/types';

import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';
import { pageBlocks } from '../../blocks';
import { createRichTextField } from '../../fields/createRichTextField';
import { slugField } from '../../fields/slug';
import { revalidatePage } from '../../hooks/revalidatePage';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: (doc) => {
      return `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/next/preview?url=${encodeURIComponent(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/${doc.slug !== 'home' ? doc.slug : ''}`,
      )}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`;
    },
    livePreview: {
      url: ({ data }) =>
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}${data.slug !== 'home' ? `/${data.slug}` : ''}`,
    },
  },
  hooks: {
    afterChange: [revalidatePage],
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
      name: 'title',
      type: 'text',
      required: true,
    },
    createRichTextField({ label: 'Content' }),
    {
      name: 'layout',
      type: 'blocks',
      label: 'Layout blocks',
      labels: {
        singular: 'Block',
        plural: 'Blocks',
      },
      blocks: pageBlocks,
      admin: {
        description:
          'Optional blocks to render below the page content (e.g. Brevo newsletter form).',
      },
    },
    {
      name: 'showEventsFirst',
      type: 'checkbox',
      label: 'Show events before announcements?',
      admin: {
        condition: (data) => data.slug === 'home',
      },
    },
    // {
    //   name: 'publishedAt',
    //   type: 'date',
    //   admin: {
    //     position: 'sidebar',
    //   },
    // },

    slugField(),
  ],
};
