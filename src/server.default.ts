import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import payload from 'payload';

dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

const app = express();
const PORT = process.env.PORT || 3000;

// Redirect root to the admin panel
app.get('/', (_, res) => {
  res.redirect('/admin');
});

const start = async (): Promise<void> => {
  await payload.init({
    secret: process.env.PAYLOAD_SECRET || '',
    express: app,
    onInit: () => {
      payload.logger.info(`Payload Admin URL: ${payload.getAdminURL()}`);
    },
  });

  app.listen(PORT, async () => {
    payload.logger.info(`App URL: ${process.env.PAYLOAD_PUBLIC_SERVER_URL}`);
  });
};

start();
