/**
 * One-off: generate Media imageSizes (thumb, card) for existing images.
 *
 *   pnpm backfill:image-sizes --dry-run
 *   pnpm backfill:image-sizes
 *   pnpm backfill:image-sizes --force
 *
 * Re-saves each image through Payload so Sharp writes the size files next to
 * the original and stores `sizes.thumb` / `sizes.card` on the document.
 * Skips docs that already have both sizes unless `--force`.
 *
 * Run on the host that has the DB and MEDIA_DIR (production: /home/lando/shush/media).
 */
import fs from 'node:fs/promises';
import path from 'node:path';

import { config as loadEnv } from 'dotenv';

for (const file of ['.env.production', '.env', '.env.local']) {
  loadEnv({
    path: path.resolve(process.cwd(), file),
    override: false,
    quiet: true,
  });
}

const dryRun = process.argv.includes('--dry-run');
const force = process.argv.includes('--force');

const { default: config } = await import('../src/payload/payload.config');
const { getPayload } = await import('payload');
const { getMediaRoot } = await import('../src/payload/paths');

if (!process.env.PAYLOAD_SECRET?.trim()) {
  console.error('Missing PAYLOAD_SECRET.');
  process.exit(1);
}

const MEDIA_DIR = getMediaRoot();

function hasSizes(doc: unknown): boolean {
  const sizes = (doc as { sizes?: { thumb?: { filename?: string | null } | null; card?: { filename?: string | null } | null } | null })
    .sizes;
  return Boolean(sizes?.thumb?.filename && sizes?.card?.filename);
}

console.log(
  `backfillImageSizes — ${dryRun ? 'dry-run' : 'live'}${force ? ' --force' : ''} — ${MEDIA_DIR}`,
);

const payload = await getPayload({ config });

let page = 1;
let updated = 0;
let skipped = 0;
let failed = 0;
let hasNextPage = true;

while (hasNextPage) {
  const result = await payload.find({
    collection: 'media',
    depth: 0,
    limit: 20,
    page,
    overrideAccess: true,
  });

  for (const doc of result.docs) {
    const mime = doc.mimeType || '';
    if (!mime.startsWith('image/') || !doc.filename) {
      skipped += 1;
      continue;
    }

    if (!force && hasSizes(doc)) {
      skipped += 1;
      continue;
    }

    const filePath = path.join(MEDIA_DIR, doc.filename);
    try {
      await fs.access(filePath);
    } catch {
      failed += 1;
      payload.logger.error(`Missing file for ${doc.id}: ${filePath}`);
      continue;
    }

    console.log(
      `${dryRun ? 'Would regenerate' : 'Regenerating'} ${doc.filename}`,
    );

    if (dryRun) {
      updated += 1;
      continue;
    }

    try {
      await payload.update({
        collection: 'media',
        id: doc.id,
        data: {},
        filePath,
        overwriteExistingFiles: true,
        overrideAccess: true,
        context: { disableRevalidate: true },
      });
      updated += 1;
    } catch (error) {
      failed += 1;
      payload.logger.error({
        err: error,
        msg: `Failed to regenerate sizes for ${doc.filename}`,
      });
    }
  }

  hasNextPage = Boolean(result.hasNextPage);
  page += 1;
}

console.log(
  `${dryRun ? 'Would update' : 'Updated'} ${updated}; skipped ${skipped}; failed ${failed}`,
);

process.exit(failed > 0 ? 1 : 0);

export {};
