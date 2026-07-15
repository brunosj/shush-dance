/* eslint-disable no-console */
import config from '../src/payload/payload.config';
import { getPayload } from 'payload';

async function run() {
  const dryRun = process.argv.includes('--dry-run');
  const payload = await getPayload({
    config,
    secret: process.env.PAYLOAD_SECRET,
  });

  let page = 1;
  let changed = 0;
  let failed = 0;

  do {
    const result = await payload.find({
      collection: 'events',
      page,
      limit: 100,
      depth: 0,
    });

    for (const event of result.docs as any[]) {
      if (!Array.isArray(event.ticketTiers)) continue;
      let eventChanged = false;
      const invalidTiers: string[] = [];
      const ticketTiers = event.ticketTiers.map((tier: any) => {
        const numericPrice = Number(tier.price);
        const next = { ...tier };
        if (!Number.isFinite(numericPrice) || numericPrice <= 0) {
          invalidTiers.push(tier.tierName || tier.id || 'unnamed tier');
        } else if (typeof tier.price !== 'number') {
          next.price = numericPrice;
          eventChanged = true;
        }
        if (typeof tier.vatRate !== 'number') {
          next.vatRate = 7;
          eventChanged = true;
        }
        return next;
      });

      if (invalidTiers.length > 0) {
        failed++;
        console.error(
          `Skipping ${event.id}; invalid ticket prices: ${invalidTiers.join(', ')}`
        );
        continue;
      }
      if (!eventChanged) continue;
      changed++;
      console.log(`${dryRun ? 'Would update' : 'Updating'} ${event.id}`);
      if (!dryRun) {
        try {
          await payload.update({
            collection: 'events',
            id: event.id,
            data: { ticketTiers },
          });
        } catch (error) {
          failed++;
          console.error(`Failed to update ${event.id}:`, error);
        }
      }
    }

    if (!result.hasNextPage) break;
    page++;
  } while (true);

  console.log(`${dryRun ? 'Would update' : 'Updated'} ${changed} events`);
  if (failed > 0) {
    console.error(`${failed} events require manual correction`);
  }
  process.exit(failed > 0 ? 1 : 0);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
