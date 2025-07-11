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

const mediaPath = path.resolve(__dirname, '../../media');
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

  // Let Next.js handle ALL routes, including API routes
  app.use((req, res) => nextHandler(req, res));

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
