import { webpackBundler } from '@payloadcms/bundler-webpack';
import { mongooseAdapter } from '@payloadcms/db-mongodb';

import { slateEditor } from '@payloadcms/richtext-slate';
import dotenv from 'dotenv';
import path from 'path';
import { buildConfig } from 'payload/config';
import Logo from './components/Logo';
import Icon from './components/Icon';

import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import Audio from './collections/Audio';
import Tracks from './collections/Tracks';
import { Events } from './collections/Events';
import { Artists } from './collections/Artists';
import { Releases } from './collections/Releases';
import { Merch } from './collections/Merch';
import Users from './collections/Users';
import { Socials } from './globals/Socials';
import { Sales } from './collections/Sales';
// import { syncBandcampSales } from './cron/fetchBandcampSales';
import { testBandcampEndpoint } from './endpoints/testBandcamp';
// import { initCronJobs } from './cron';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

export default buildConfig({
  admin: {
    user: Users.slug,
    bundler: webpackBundler(),
    components: {
      graphics: {
        Logo,
        Icon,
      },
    },
  },
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI,
  }),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  collections: [
    Events,
    Releases,
    Merch,
    Artists,
    Tracks,
    Pages,
    Audio,
    Media,
    Users,
    Sales,
  ],
  globals: [Socials],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
    declare: false,
  },
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  endpoints: [testBandcampEndpoint],
  // onInit: async (payload) => {
  //   initCronJobs();
  // },
});
