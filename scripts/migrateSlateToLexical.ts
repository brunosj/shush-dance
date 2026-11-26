/**
 * Permanently convert stored Slate rich text to Lexical JSON.
 * Run only against a database backup (e.g. cms_v3_staging).
 *
 *   pnpm migrate:slate-to-lexical
 */
import { migrateSlateToLexical } from '@payloadcms/richtext-lexical/migrate';
import { getPayload } from 'payload';

import config from '../src/payload/payload.config';

const run = async () => {
  const payload = await getPayload({ config });
  await migrateSlateToLexical({ payload });
  process.exit(0);
};

void run().catch((err) => {
  console.error(err);
  process.exit(1);
});