/* eslint-disable no-console */
// Export script for legacy events only (full docs including descriptions).
// Usage (from shush-dance root):
//   node scripts/exportEvents.cjs ./events.json

const fs = require('fs')
const path = require('path')

require('ts-node/register')

require.extensions['.scss'] = () => {}
require.extensions['.css'] = () => {}
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
    console.error('Please provide an output file path, e.g. ./events.json')
    process.exit(1)
  }

  const outputPath = path.resolve(process.cwd(), outputArg)

  await payload.init({
    config: payloadConfig,
  })

  console.log('Exporting legacy events (including descriptions)...')

  const eventsRes = await payload.find({
    collection: 'events',
    limit: 0,
    pagination: false,
    depth: 2,
  })

  fs.writeFileSync(outputPath, JSON.stringify({ events: eventsRes.docs }, null, 2), 'utf8')

  console.log(`Exported ${eventsRes.docs.length} events to ${outputPath}`)
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

