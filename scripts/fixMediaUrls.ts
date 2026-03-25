/**
 * Fix broken Media upload URLs by normalizing `media.url` to `${staticURL}/${filename}`.
 *
 * Typical symptoms:
 * - `url` contains an old domain (e.g. previous VPS)
 * - `url` is null/empty even though `filename` exists
 *
 * Usage (from shush-dance root):
 *   pnpm ts-node scripts/fixMediaUrls.ts
 *   pnpm ts-node scripts/fixMediaUrls.ts --dry-run
 *   pnpm ts-node scripts/fixMediaUrls.ts --media-dir /home/lando/media
 *   pnpm ts-node scripts/fixMediaUrls.ts --static-url /media
 */
/* eslint-disable no-console */

import fs from 'fs';
import path from 'path';

import config from '../src/payload/payload.config';
import { getPayload } from 'payload';

type Args = {
  dryRun: boolean;
  mediaDir?: string;
  staticURL: string;
  limit: number;
};

const parseArgs = (): Args => {
  const argv = process.argv.slice(2);
  const get = (flag: string) => {
    const idx = argv.indexOf(flag);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };

  return {
    dryRun: argv.includes('--dry-run'),
    mediaDir: get('--media-dir'),
    staticURL: get('--static-url') ?? '/media',
    limit: Number(get('--limit') ?? 100),
  };
};

const normalizeStaticURL = (staticURL: string) => {
  if (!staticURL) return '/media';
  const trimmed = staticURL.trim();
  if (trimmed === '/') return '';
  return trimmed.startsWith('/') ? trimmed.replace(/\/+$/, '') : `/${trimmed.replace(/\/+$/, '')}`;
};

const desiredUrlForFilename = (staticURL: string, filename: string) => {
  const base = normalizeStaticURL(staticURL);
  const name = filename.replace(/^\/+/, '');
  return `${base}/${name}`.replace(/\/{2,}/g, '/');
};

const run = async () => {
  const args = parseArgs();
  const staticURL = normalizeStaticURL(args.staticURL);

  const payload = await getPayload({
    config,
    secret: process.env.PAYLOAD_SECRET,
  });

  const mediaDir =
    args.mediaDir ||
    process.env.MEDIA_DIR ||
    // In production: /home/lando/media (6 levels up from dist/payload/collections/)
    path.resolve(__dirname, '../media');

  console.log('Fixing media URLs with:');
  console.log(`- staticURL: ${staticURL}`);
  console.log(`- mediaDir:  ${mediaDir}`);
  console.log(`- dryRun:    ${args.dryRun ? 'yes' : 'no'}`);

  let page = 1;
  let updated = 0;
  let skipped = 0;
  let missingFiles = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await payload.find({
      collection: 'media',
      page,
      limit: args.limit,
      pagination: true,
      depth: 0,
    });

    for (const doc of res.docs as Array<{
      id: string;
      filename?: string | null;
      url?: string | null;
    }>) {
      if (!doc.filename) {
        skipped += 1;
        continue;
      }

      const expectedUrl = desiredUrlForFilename(staticURL, doc.filename);
      const currentUrl = (doc.url ?? '').trim();

      const filePath = path.join(mediaDir, doc.filename);
      const exists = fs.existsSync(filePath);
      if (!exists) missingFiles += 1;

      if (currentUrl === expectedUrl) {
        skipped += 1;
        continue;
      }

      console.log(
        [
          `media:${doc.id}`,
          `filename=${doc.filename}`,
          exists ? 'file=ok' : `file=MISSING(${filePath})`,
          `url: ${currentUrl || '(empty)'} -> ${expectedUrl}`,
        ].join(' | '),
      );

      if (!args.dryRun) {
        await payload.update({
          collection: 'media',
          id: doc.id,
          data: {
            url: expectedUrl,
          },
        });
      }

      updated += 1;
    }

    if (!res.hasNextPage) break;
    page += 1;
  }

  console.log('Done.');
  console.log(`- updated:       ${updated}${args.dryRun ? ' (dry-run)' : ''}`);
  console.log(`- skipped:       ${skipped}`);
  console.log(`- missing files: ${missingFiles}`);
};

void run();

