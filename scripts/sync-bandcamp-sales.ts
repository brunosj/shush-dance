import dotenv from 'dotenv';
import cron from 'node-cron';
import { MongoClient } from 'mongodb';
import {
  fetchBands,
  fetchSalesForBand,
} from '../src/payload/services/bandcamp';

dotenv.config();

const MONGODB_URI = process.env.DATABASE_URI;
const DB_NAME = process.env.DB_NAME || 'cms';

// Helper to format dates for logging
const formatDate = (date: Date) => date.toISOString().split('T')[0];

async function syncSales() {
  const startTime = new Date();
  console.log(`[${startTime.toISOString()}] Starting sync...`);

  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);

  try {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);
    console.log(
      `Fetching sales from ${formatDate(startDate)} to ${formatDate(endDate)}`
    );

    const bands = await fetchBands();
    console.log(`Found ${bands.length} bands to process`);

    let totalProcessed = 0;
    let newSales = 0;

    for (const band of bands) {
      console.log(`Processing band: ${band.name}`);
      const salesData = await fetchSalesForBand(
        band.band_id,
        startDate,
        endDate
      );

      if (salesData.report && Array.isArray(salesData.report)) {
        for (const sale of salesData.report) {
          totalProcessed++;

          // Check if sale exists
          const existingSale = await db.collection('sales').findOne({
            bandcampOrderId: sale.bandcamp_transaction_id.toString(),
          });

          if (!existingSale) {
            await db.collection('sales').insertOne({
              bandId: band.band_id,
              bandName: band.name,
              bandSubdomain: band.subdomain,
              itemName: `${sale.artist} - ${sale.item_name}`,
              amount: sale.item_total,
              currency: sale.currency,
              soldAt: new Date(sale.date),
              platform: 'bandcamp',
              bandcampOrderId: sale.bandcamp_transaction_id.toString(),
              customerLocation: `${sale.city}, ${sale.country}`,
              notes: `Package: ${sale.package}`,
              createdAt: new Date(),
            });
            newSales++;
          }
        }
      }
    }

    const endTime = new Date();
    const duration = (endTime.getTime() - startTime.getTime()) / 1000;

    console.log(`
Sync completed in ${duration}s
Total sales processed: ${totalProcessed}
New sales added: ${newSales}
Bands processed: ${bands.length}
    `);
  } catch (error) {
    console.error('Error syncing sales:', error);
  } finally {
    await client.close();
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM - shutting down gracefully');
  process.exit(0);
});

// Run at midnight every day
cron.schedule('0 0 * * *', syncSales);

// Initial run
syncSales();

console.log('Bandcamp sales sync service started');
