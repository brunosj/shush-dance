import dotenv from 'dotenv';
import next from 'next';
import nextBuild from 'next/dist/build';
import path from 'path';
import express from 'express';
import { getPayloadClient } from './payload/getPayload';
import payload from 'payload';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

const app = express();

// Media path: use env var or resolve to /home/lando/media in production
const mediaPath =
  process.env.MEDIA_DIR || path.resolve(__dirname, '../../../media');
console.log('Serving media from:', mediaPath);
app.use('/media', express.static(mediaPath));

const PORT = process.env.PORT || 3000;
const start = async (): Promise<void> => {
  console.log(`Server starting on port ${PORT}`);

  const payload = await getPayloadClient({
    initOptions: {
      express: app,
      onInit: async (newPayload) => {
        newPayload.logger.info(
          `Payload Admin URL: ${newPayload.getAdminURL()}`
        );
      },
    },
  });

  if (process.env.NEXT_BUILD) {
    app.listen(PORT, async () => {
      payload.logger.info(`Next.js is now building...`);
      // @ts-expect-error
      await nextBuild(path.join(__dirname, '../'));
      process.exit();
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
        `Next.js App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`
      );
    });
  });
};

start();
