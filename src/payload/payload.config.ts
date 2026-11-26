import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { mongooseAdapter } from '@payloadcms/db-mongodb';
import { nodemailerAdapter } from '@payloadcms/email-nodemailer';
import { shushLexicalEditor } from './fields/shushLexicalEditor';
import dotenv from 'dotenv';
import { buildConfig } from 'payload';
import sharp from 'sharp';

import { Artists } from './collections/Artists';
import Audio from './collections/Audio';
import { Documents } from './collections/Documents';
import { Events } from './collections/Events';
import { Media } from './collections/Media';
import { Merch } from './collections/Merch';
import { OnlineOrders } from './collections/OnlineOrders';
import { Pages } from './collections/Pages';
import { Releases } from './collections/Releases';
import { Sales } from './collections/Sales';
import { TicketSales } from './collections/TicketSales';
import Tracks from './collections/Tracks';
import Users from './collections/Users';
import { backfillStripeFeesEndpoint } from './endpoints/backfillStripeFees';
import { createPaymentIntentEndpoint } from './endpoints/createPaymentIntent';
import { createSaleEndpoint } from './endpoints/createSale';
import { ensureOrderCreatedEndpoint } from './endpoints/ensureOrderCreated';
import { getPaymentStatusEndpoint } from './endpoints/getPaymentStatus';
import { healthEndpoint } from './endpoints/health';
import { monitorPaymentSystemEndpoint } from './endpoints/monitorPaymentSystem';
import { publicEventTicketStatsEndpoint } from './endpoints/publicEventTicketStats';
import { stripeBackfillTicketSalesEndpoint } from './endpoints/stripeBackfillTicketSales';
import { stripeWebhookEndpoint } from './endpoints/stripeWebhook';
import { ticketBuyerQuestionsEndpoint } from './endpoints/ticketBuyerQuestions';
import { syncBandcampEndpoint } from './endpoints/syncBandcamp';
import { testBandcampEndpoint } from './endpoints/testBandcamp';
import { Settings } from './globals/settings';
import { Socials } from './globals/Socials';
import { getEnvFilePath } from './paths';

dotenv.config({ path: getEnvFilePath() });

const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

function resolveDatabaseUri(uri: string | undefined): string | undefined {
  if (!uri) return uri;
  return uri
    .replace(
      /^(mongodb(?:\+srv)?:\/\/[^@/]*@)localhost(?=[:/]|$)/i,
      '$1127.0.0.1',
    )
    .replace(/^(mongodb(?:\+srv)?:\/\/)localhost(?=[:/]|$)/i, '$1127.0.0.1');
}

export default buildConfig({
  secret: process.env.PAYLOAD_SECRET || '',
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
    components: {
      graphics: {
        Logo: './components/Logo#default',
        Icon: './components/Icon#default',
      },
    },
    meta: {
      openGraph: {
        images: [],
      },
    },
  },
  editor: shushLexicalEditor,
  db: mongooseAdapter({
    url: resolveDatabaseUri(process.env.DATABASE_URI) || '',
    connectOptions: {
      family: 4,
    },
  }),
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL,
  routes: {
    api: '/api',
    admin: '/admin',
    graphQL: '/api/graphql',
    graphQLPlayground: '/api/graphql-playground',
  },
  collections: [
    Events,
    TicketSales,
    Releases,
    Merch,
    OnlineOrders,
    Sales,
    Artists,
    Tracks,
    Audio,
    Pages,
    Documents,
    Media,
    Users,
  ],
  globals: [Socials, Settings],
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
    declare: false,
  },
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  endpoints: [
    healthEndpoint,
    testBandcampEndpoint,
    syncBandcampEndpoint,
    createPaymentIntentEndpoint,
    createSaleEndpoint,
    monitorPaymentSystemEndpoint,
    stripeWebhookEndpoint,
    ensureOrderCreatedEndpoint,
    getPaymentStatusEndpoint,
    stripeBackfillTicketSalesEndpoint,
    backfillStripeFeesEndpoint,
    publicEventTicketStatsEndpoint,
    ticketBuyerQuestionsEndpoint,
  ],
  email: nodemailerAdapter({
    defaultFromName: 'SHUSH',
    defaultFromAddress: 'hello@shush.dance',
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  }),
  sharp,
});