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
import { OnlineOrders } from './collections/OnlineOrders';
import { TicketSales } from './collections/TicketSales';
import Users from './collections/Users';
import { Socials } from './globals/Socials';
import { Sales } from './collections/Sales';
import { testBandcampEndpoint } from './endpoints/testBandcamp';
import { syncBandcampEndpoint } from './endpoints/syncBandcamp';
import { createPaymentIntentEndpoint } from './endpoints/createPaymentIntent';
import { createSaleEndpoint } from './endpoints/createSale';
import { monitorPaymentSystemEndpoint } from './endpoints/monitorPaymentSystem';
import { stripeWebhookEndpoint } from './endpoints/stripeWebhook';
import { ensureOrderCreatedEndpoint } from './endpoints/ensureOrderCreated';
import { getPaymentStatusEndpoint } from './endpoints/getPaymentStatus';
import { stripeBackfillTicketSalesEndpoint } from './endpoints/stripeBackfillTicketSales';
import { backfillStripeFeesEndpoint } from './endpoints/backfillStripeFees';
import { healthEndpoint } from './endpoints/health';
import { publicEventTicketStatsEndpoint } from './endpoints/publicEventTicketStats';
import { Settings } from './globals/settings';

dotenv.config({
  path: path.resolve(__dirname, '../../.env'),
});

/** Node 17+ resolves `localhost` to IPv6 (::1) first; mongod often only listens on 127.0.0.1. */
function resolveDatabaseUri(uri: string | undefined): string | undefined {
  if (!uri) return uri;
  return uri.replace(
    /^(mongodb(?:\+srv)?:\/\/[^@/]*@)localhost(?=[:/]|$)/i,
    '$1127.0.0.1'
  ).replace(/^(mongodb(?:\+srv)?:\/\/)localhost(?=[:/]|$)/i, '$1127.0.0.1');
}

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
    url: resolveDatabaseUri(process.env.DATABASE_URI),
    connectOptions: {
      // Prefer IPv4 when the URI still contains a hostname that resolves both ways.
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
    // Events
    Events,
    TicketSales,
    // Shop
    Releases,
    Merch,
    OnlineOrders,
    Sales,
    // Music
    Artists,
    Tracks,
    Audio,
    // Content
    Pages,
    Media,
    // Admin
    Users,
  ],
  globals: [Socials, Settings],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
    declare: false,
  },
  cors: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  csrf: [process.env.PAYLOAD_PUBLIC_SERVER_URL || ''].filter(Boolean),
  rateLimit: {
    // Honour X-Forwarded-For so the limiter keys on the real visitor IP
    // instead of the nginx proxy address (otherwise every request shares
    // a single 127.0.0.1 bucket and the whole site gets rate limited).
    trustProxy: true,
    window: 15 * 60 * 1000,
    max: 5000,
    // Never rate limit internal server-side requests. All SSR data fetching
    // authenticates with the server-only API key, and the Stripe webhook is
    // trusted; counting these against the limit is what 404s the homepage.
    skip: (req) => {
      const authHeader = req.headers?.authorization || '';
      if (authHeader.includes('API-Key')) return true;
      if (req.path?.startsWith('/stripe-webhook')) return true;
      return false;
    },
  },
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
  ],
  email: {
    fromName: 'SHUSH',
    fromAddress: 'hello@shush.dance',
    logMockCredentials: false,
    transportOptions: {
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    },
  },
});
