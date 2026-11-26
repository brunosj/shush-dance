import type { CollectionConfig } from 'payload';

import { admins } from '../../access/admins';
import { adminsOrPublished } from '../../access/adminsOrPublished';
import { pageBlocks } from '../../blocks';
import { createRichTextField } from '../../fields/createRichTextField';
import { meta } from '../../fields/meta';
import { slugField } from '../../fields/slug';
import {
  revalidatePage,
  revalidatePageDelete,
} from '../../hooks/revalidateContent';
import { getDraftPreviewSecret } from '../../utilities/draftPreviewSecret';

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    group: 'Content',
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'updatedAt'],
    preview: (doc) => {
      return `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/next/preview?url=${encodeURIComponent(
        `${process.env.PAYLOAD_PUBLIC_SERVER_URL}/${doc.slug !== 'home' ? doc.slug : ''}`,
      )}&secret=${getDraftPreviewSecret()}`;
    },
    livePreview: {
      url: ({ data, collectionConfig }) => {
        if (collectionConfig.slug !== 'pages' || !data?.slug) {
          return null;
        }
        const path = data.slug === 'home' ? '' : `/${data.slug}`;
        return `${process.env.PAYLOAD_PUBLIC_SERVER_URL}${path}`;
      },
    },
  },
  hooks: {
    afterChange: [revalidatePage],
    afterDelete: [revalidatePageDelete],
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

    meta,
    slugField(),
  ],
};
