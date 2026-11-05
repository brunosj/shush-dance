import dotenv from 'dotenv';
import express from 'express';
import next from 'next';
import nextBuild from 'next/dist/build';

import { getPayloadClient } from './payload/getPayload';
import { getEnvFilePath, getMediaRoot, getProjectRoot } from './payload/paths';
import { setupStripeTicketSalesCron } from './payload/services/stripeTicketSalesCron';

dotenv.config({
  path: getEnvFilePath(),
});

const app = express();

const mediaPath = getMediaRoot();
console.log('Serving media from:', mediaPath);
app.use('/media', express.static(mediaPath));

// Stripe needs the untouched raw body to verify the webhook signature.
// Must be registered before Payload attaches its JSON body parser.
app.use('/api/stripe-webhook', express.raw({ type: 'application/json' }));

const PORT = process.env.PORT || 3000;
const start = async (): Promise<void> => {
  console.log(`Server starting on port ${PORT}`);

  const payload = await getPayloadClient({
    initOptions: {
      express: app,
      onInit: async (newPayload) => {
        newPayload.logger.info(
          `Payload Admin URL: ${newPayload.getAdminURL()}`,
        );
      },
    },
  });

  if (process.env.NEXT_BUILD) {
    // Bind only for Payload init during `next build`. Prefer a dedicated
    // PORT (package.json uses 3999) so this never clashes with a live PM2
    // process on 3000 during deploy.
    app.listen(PORT, async () => {
      payload.logger.info(
        `Next.js is now building on temporary port ${PORT}...`,
      );
      // @ts-expect-error nextBuild's typings expect extra args at runtime it doesn't need
      await nextBuild(getProjectRoot());
      process.exit(0);
    });

    return;
  }

  const nextApp = next({
    dev: process.env.NODE_ENV !== 'production',
  });

  const nextHandler = nextApp.getRequestHandler();

  app.use('/admin', (req, res, next) => {
    if (req.url === '/admin') {
      res.redirect('/admin/');
      return;
    }
    next();
  });

  // Let Next.js handle all other routes (non-API, non-media routes)
  app.use((req, res) => {
    // Skip API routes - let Payload handle them
    if (req.url.startsWith('/api/')) {
      return; // Don't handle API routes with Next.js
    }
    // Skip media routes - let Express static middleware handle them
    if (req.url.startsWith('/media/')) {
      return; // Don't handle media routes with Next.js
    }
    return nextHandler(req, res);
  });

  nextApp.prepare().then(() => {
    payload.logger.info('Next.js started');

    app.listen(PORT, async () => {
      payload.logger.info(
        `Next.js App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`,
      );
      setupStripeTicketSalesCron();
    });
  });
};

start();
