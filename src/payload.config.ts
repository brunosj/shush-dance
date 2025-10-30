import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { slateEditor } from '@payloadcms/richtext-slate';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { buildConfig } from 'payload';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { Media } from './collections/Media';
import { Pages } from './collections/Pages';
import Audio from './collections/Audio';
import Tracks from './collections/Tracks';
import { Events } from './collections/Events';
import { Artists } from './collections/Artists';
import { Releases } from './collections/Releases';
import { Merch } from './collections/Merch';
import { OnlineOrders } from './collections/OnlineOrders';
import { TicketSales } from './collections/TicketSales';
import Users from './collections/Users';
import { Socials } from './globals/Socials';
import { Sales } from './collections/Sales';
import { testBandcampEndpoint } from './endpoints/testBandcamp';
import { syncBandcampEndpoint } from './endpoints/syncBandcamp';
import { createOrderEndpoint } from './endpoints/createOrder';
import { createPaymentIntentEndpoint } from './endpoints/createPaymentIntent';
import { createSaleEndpoint } from './endpoints/createSale';
import { monitorPaymentSystemEndpoint } from './endpoints/monitorPaymentSystem';
import { clientErrorReportEndpoint } from './endpoints/clientErrorReport';
import { stripeWebhookEndpoint } from './endpoints/stripeWebhook';
import { ensureOrderCreatedEndpoint } from './endpoints/ensureOrderCreated';
import { Settings } from './globals/settings';

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

export default buildConfig({
  admin: {
    user: Users.slug,
    // components: {
    //   graphics: {
    //     Logo,
    //     Icon,
    //   },
    // },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: slateEditor({}),
  db: mongooseAdapter({
    url: process.env.DATABASE_URI || '',
  }),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  routes: {
    api: '/api',
    admin: '/admin',
    graphQL: '/api/graphql',
    graphQLPlayground: '/api/graphql-playground',
  },
  secret: process.env.PAYLOAD_SECRET || '',
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
    OnlineOrders,
    TicketSales,
  ],
  globals: [Socials, Settings],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  endpoints: [
    testBandcampEndpoint,
    syncBandcampEndpoint,
    createOrderEndpoint,
    createPaymentIntentEndpoint,
    createSaleEndpoint,
    monitorPaymentSystemEndpoint,
    clientErrorReportEndpoint,
    stripeWebhookEndpoint,
    ensureOrderCreatedEndpoint,
  ],
  // email: nodemailerAdapter({
  //   defaultFromAddress: 'hello@shush.dance',
  //   defaultFromName: 'SHUSH',
  //   transport: await nodemailer.createTransport({
  //     host: process.env.SMTP_HOST,
  //     port: 587,
  //     auth: {
  //       user: process.env.SMTP_USER,
  //       pass: process.env.SMTP_PASS,
  //     },
  //   }),
  // }),
});
