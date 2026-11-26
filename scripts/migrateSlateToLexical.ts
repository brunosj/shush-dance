/**
 * Permanently convert stored Slate rich text to Lexical JSON.
 * Run only against a database backup (e.g. cms_v3_staging).
 *
 *   pnpm migrate:slate-to-lexical
 *
 * `payload run` waits for this module to finish evaluating. The work has to
 * be top-level await, not a floating promise, or the process exits immediately.
 */
process.env.SLATE_TO_LEXICAL_DISABLE_HOOKS = 'true';

const { migrateSlateToLexical } = await import(
  '@payloadcms/richtext-lexical/migrate'
);
const { getPayload } = await import('payload');
const { default: config } = await import('../src/payload/payload.config');

console.log('Starting Slate to Lexical migration...');

const payload = await getPayload({ config });
await migrateSlateToLexical({ payload });

console.log('Slate to Lexical migration finished.');
process.exit(0);

export {};
