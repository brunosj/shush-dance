/* eslint-disable no-console */
// Export script for legacy merch + releases only.
// Usage (from shush-dance root):
//   node scripts/exportProducts.cjs ./products.json

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
    console.error('Please provide an output file path, e.g. ./products.json')
    process.exit(1)
  }

  const outputPath = path.resolve(process.cwd(), outputArg)

  await payload.init({
    config: payloadConfig,
  })

  console.log('Exporting legacy products (merch + releases)...')

  const [merchRes, releasesRes] = await Promise.all([
    payload.find({
      collection: 'merch',
      limit: 0,
      pagination: false,
      depth: 2,
    }),
    payload.find({
      collection: 'releases',
      limit: 0,
      pagination: false,
      depth: 2,
    }),
  ])

  const data = {
    merch: merchRes.docs,
    releases: releasesRes.docs,
  }

  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2), 'utf8')

  console.log(
    `Exported ${merchRes.docs.length} merch and ${releasesRes.docs.length} releases to ${outputPath}`,
  )
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})

