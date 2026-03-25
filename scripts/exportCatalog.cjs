/* eslint-disable no-console */
// CJS export script to avoid admin bundle asset issues.
// Usage (from shush-dance root):
//   node scripts/exportCatalog.cjs ./legacy-catalog.json

const fs = require('fs')
const path = require('path')

// Allow requiring local TypeScript config
require('ts-node/register')

// Ignore asset imports that might be pulled in by Payload's admin bundle
require.extensions['.scss'] = () => {}
require.extensions['.svg'] = () => {}
require.extensions['.png'] = () => {}
require.extensions['.jpg'] = () => {}
require.extensions['.jpeg'] = () => {}
require.extensions['.gif'] = () => {}
require.extensions['.webp'] = () => {}

const payload = require('payload')
const payloadConfig = require('../src/payload/payload.config.ts').default

async function run() {
  const [, , outputArg] = process.argv

  if (!outputArg) {
    console.error('Please provide an output file path, e.g. ./legacy-catalog.json')
    process.exit(1)
  }

  const outputPath = path.resolve(process.cwd(), outputArg)

  // Initialize Payload v2 with the existing config
  await payload.init({
    config: payloadConfig,
  })

  console.log('Exporting legacy catalog from shush-dance...')

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
  ])

  const data = {
    releases: releasesRes.docs,
    merch: merchRes.docs,
    events: eventsRes.docs,
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8')

  console.log(`Exported catalog to ${outputPath}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

