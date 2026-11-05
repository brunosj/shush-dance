/**
 * Backfill real Stripe processing fees onto ticket-sales.
 *
 * Usage (from shush-dance root):
 *   node scripts/backfillStripeFees.cjs --dry-run
 *   node scripts/backfillStripeFees.cjs
 *   node scripts/backfillStripeFees.cjs --force
 *   node scripts/backfillStripeFees.cjs --limit 10
 */

const path = require("path");

require("dotenv").config({
  path: path.resolve(__dirname, "../.env"),
});

require("ts-node/register");

require.extensions[".scss"] = () => {};
require.extensions[".css"] = () => {};
require.extensions[".svg"] = () => {};
require.extensions[".png"] = () => {};
require.extensions[".jpg"] = () => {};
require.extensions[".jpeg"] = () => {};
require.extensions[".gif"] = () => {};
require.extensions[".webp"] = () => {};

const payload = require("payload");
const payloadConfig = require("../src/payload/payload.config.ts").default;
const {
  backfillStripeFees,
} = require("../src/payload/utils/backfillStripeFees.ts");

function parseArgs() {
  const argv = process.argv.slice(2);
  const get = (flag) => {
    const idx = argv.indexOf(flag);
    if (idx === -1) return undefined;
    return argv[idx + 1];
  };
  const limitRaw = get("--limit");
  return {
    dryRun: argv.includes("--dry-run"),
    force: argv.includes("--force"),
    limit: limitRaw ? parseInt(limitRaw, 10) : undefined,
  };
}

async function run() {
  const args = parseArgs();

  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is missing");
  }
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error("PAYLOAD_SECRET is missing");
  }

  await payload.init({
    config: payloadConfig,
    secret: process.env.PAYLOAD_SECRET,
    local: true,
  });

  console.log("Starting Stripe fee backfill…", args);
  const result = await backfillStripeFees(payload, args);
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.errors > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
