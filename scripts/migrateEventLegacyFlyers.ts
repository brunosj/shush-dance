/**
 * Copy Events.image (legacy single flyer) into Events.images (Event Flyers array)
 * when the array is empty or does not already include that media id.
 *
 * Does not clear the legacy field.
 *
 *   pnpm migrate:event-legacy-flyers --dry-run
 *   pnpm migrate:event-legacy-flyers
 */
import { getPayload } from 'payload';

import config from '../src/payload/payload.config';

function mediaId(
  value: string | { id?: string | number } | null | undefined,
): string | null {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (value.id == null) return null;
  return String(value.id);
}

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({ config });

  let page = 1;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let hasNextPage = true;

  while (hasNextPage) {
    const result = await payload.find({
      collection: 'events',
      page,
      limit: 100,
      depth: 0,
      overrideAccess: true,
      where: {
        image: { exists: true },
      },
    });

    for (const event of result.docs) {
      const legacyId = mediaId(event.image);
      if (!legacyId) {
        skipped += 1;
        continue;
      }

      const existing = Array.isArray(event.images) ? event.images : [];
      const alreadyPresent = existing.some(
        (row) => mediaId(row?.image) === legacyId,
      );

      if (alreadyPresent) {
        skipped += 1;
        continue;
      }

      const nextImages = [{ image: legacyId }, ...existing];
      const label = event.title || event.slug || event.id;

      console.log(
        `${dryRun ? 'Would update' : 'Updating'} ${event.id} (${label}): add legacy flyer ${legacyId} → images[${nextImages.length}]`,
      );

      if (!dryRun) {
        try {
          await payload.update({
            collection: 'events',
            id: event.id,
            data: { images: nextImages },
            overrideAccess: true,
            context: { disableRevalidate: true },
          });
          updated += 1;
        } catch (error) {
          failed += 1;
          console.error(`Failed to update ${event.id}:`, error);
        }
      } else {
        updated += 1;
      }
    }

    hasNextPage = Boolean(result.hasNextPage);
    page += 1;
  }

  console.log(
    `${dryRun ? 'Would update' : 'Updated'} ${updated}; skipped ${skipped}; failed ${failed}`,
  );
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
