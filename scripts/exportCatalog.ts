/**
 * Export legacy catalog data (releases, merch, events)
 * from the `shush-dance` project into a JSON file.
 *
 * Usage (from shush-dance directory):
 *   pnpm ts-node scripts/exportCatalog.ts ./legacy-catalog.json
 */

/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

import config from '../src/payload/payload.config';
import { getPayload } from 'payload';

const run = async () => {
  const [, , outputArg] = process.argv;

  if (!outputArg) {
    console.error(
      'Please provide an output file path, e.g. ./legacy-catalog.json',
    );
    process.exit(1);
  }

  const outputPath = path.resolve(process.cwd(), outputArg);

  const payload = await getPayload({
    config,
    secret: process.env.PAYLOAD_SECRET,
  });

  console.log('Exporting legacy catalog from shush-dance...');

  const [releasesRes, merchRes, eventsRes] = await Promise.all([
    payload.find({
      collection: 'releases',
      limit: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'merch',
      limit: 0,
      pagination: false,
    }),
    payload.find({
      collection: 'events',
      limit: 0,
      pagination: false,
    }),
  ]);

  const data = {
    releases: releasesRes.docs,
    merch: merchRes.docs,
    events: eventsRes.docs,
  };

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8');

  console.log(`Exported catalog to ${outputPath}`);
  process.exit(0);
};

void run();
