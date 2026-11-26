/**
 * One-off: generate Media.blurDataURL for existing uploads that lack it.
 *
 *   pnpm backfill:blur
 *   MEDIA_DIR=/home/lando/shush/media pnpm backfill:blur
 *
 * Run on the host that has DB + media files (deploy media dir is typically
 * symlinked to `getMediaRoot()` / `MEDIA_DIR`). Not part of every deploy.
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { config as loadEnv } from 'dotenv';
import { getPlaiceholder } from 'plaiceholder';

for (const file of ['.env.production', '.env', '.env.local']) {
  loadEnv({
    path: path.resolve(process.cwd(), file),
    override: false,
    quiet: true,
  });
}

const { default: config } = await import('../src/payload/payload.config');
const { getPayload } = await import('payload');
const { getMediaRoot } = await import('../src/payload/paths');

if (!process.env.PAYLOAD_SECRET?.trim()) {
  console.error(
    'Missing PAYLOAD_SECRET. Ensure .env.production (or .env) is present.',
  );
  process.exit(1);
}

const MEDIA_DIR = getMediaRoot();

async function readMediaBuffer(filename: string): Promise<Buffer | null> {
  const filePath = path.join(MEDIA_DIR, filename);

  try {
    return await fs.readFile(filePath);
  } catch {
    return null;
  }
}

async function resolveBufferFromDoc(doc: {
  url?: string | null;
  filename?: string | null;
  id?: string | number;
}): Promise<Buffer | null> {
  if (doc.filename) {
    const fromDisk = await readMediaBuffer(doc.filename);
    if (fromDisk?.byteLength) return fromDisk;
  }

  const rawUrl = doc.url?.trim();
  if (!rawUrl) return null;

  if (rawUrl.startsWith('http://') || rawUrl.startsWith('https://')) {
    try {
      const response = await fetch(rawUrl);
      if (!response.ok) return null;
      return Buffer.from(await response.arrayBuffer());
    } catch {
      return null;
    }
  }

  const serverBase =
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.replace(/\/$/, '') ||
    process.env.NEXT_PUBLIC_SERVER_URL?.replace(/\/$/, '');

  if (!serverBase) return null;

  const pathname = rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`;

  try {
    const response = await fetch(`${serverBase}${pathname}`);
    if (!response.ok) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

console.log(`backfillBlurDataURL — media dir: ${MEDIA_DIR}`);

const payload = await getPayload({ config });
let updated = 0;
let skipped = 0;
let failed = 0;

for (;;) {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 50,
    overrideAccess: true,
    page: 1,
    where: {
      or: [
        { blurDataURL: { exists: false } },
        { blurDataURL: { equals: null } },
        { blurDataURL: { equals: '' } },
      ],
    },
  });

  if (result.docs.length === 0) {
    break;
  }

  let batchUpdated = 0;

  for (const doc of result.docs) {
    const buffer = await resolveBufferFromDoc(doc);
    if (!buffer || buffer.byteLength === 0) {
      failed += 1;
      payload.logger.error({
        msg: `Missing file/URL for media ${doc.id}`,
        filename: doc.filename,
        url: doc.url,
      });
      continue;
    }

    if (!doc.filename) {
      skipped += 1;
      payload.logger.warn(`Skipping media ${doc.id}: no filename`);
      continue;
    }

    try {
      const { base64 } = await getPlaiceholder(buffer, { size: 10 });
      await payload.update({
        collection: 'media',
        context: { disableRevalidate: true },
        data: { blurDataURL: base64 },
        id: doc.id,
        overrideAccess: true,
      });
      batchUpdated += 1;
      updated += 1;
      payload.logger.info(`Updated blurDataURL for ${doc.filename}`);
    } catch (error) {
      failed += 1;
      payload.logger.error({
        err: error,
        msg: `Failed to generate blurDataURL for ${doc.filename}`,
      });
    }
  }

  if (batchUpdated === 0) {
    break;
  }
}

payload.logger.info(
  `backfillBlurDataURL done — updated=${updated} skipped=${skipped} failed=${failed}`,
);

process.exit(failed > 0 ? 1 : 0);

export {};