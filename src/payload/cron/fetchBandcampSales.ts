import payload from 'payload';
import { fetchBands, fetchSalesForBand } from '../services/bandcamp';

interface BandcampSaleItem {
  bandcamp_transaction_id: number;
  date: string;
  item_type: string;
  item_name: string;
  currency: string;
  item_total: number;
  country: string;
  package: string;
  artist: string;
}

const determineItemType = (
  itemType: string,
  packageType: string
): 'record' | 'merch' | 'digital' => {
  // Handle digital sales
  if (
    itemType.toLowerCase() === 'track' ||
    itemType.toLowerCase() === 'album'
  ) {
    return 'digital';
  }

  // Handle physical sales (package)
  if (itemType.toLowerCase() === 'package') {
    // Check package description for record-related keywords
    const packageLower = packageType.toLowerCase();
    if (
      packageLower.includes('vinyl') ||
      packageLower.includes('lp') ||
      packageLower.includes('cd') ||
      packageLower.includes('record')
    ) {
      return 'record';
    }
    // If not a record, it's merch
    return 'merch';
  }

  // Default fallback
  return 'merch';
};

export const syncBandcampSales = async () => {
  const endDate = new Date();
  const startDate = new Date(endDate.getTime() - 24 * 60 * 60 * 1000);

  try {
    // First fetch all bands
    const bands = await fetchBands();
    let processedCount = 0;
    let totalSales = 0;

    // Process sales for each band
    for (const band of bands) {
      const salesData = await fetchSalesForBand(
        band.band_id,
        startDate,
        endDate
      );

      if (salesData.report && Array.isArray(salesData.report)) {
        totalSales += salesData.report.length;

        for (const sale of salesData.report) {
          const existingSale = await payload.find({
            collection: 'sales',
            where: {
              bandcampOrderId: {
                equals: sale.bandcamp_transaction_id.toString(),
              },
            },
          });

          if (existingSale.totalDocs === 0) {
            await payload.create({
              collection: 'sales',
              data: {
                bandId: band.band_id,
                bandName: band.name,
                bandSubdomain: band.subdomain,
                itemName: `${sale.artist} - ${sale.item_name}`,
                type: determineItemType(sale.item_type, sale.package),
                amount: sale.item_total,
                currency: sale.currency,
                soldAt: new Date(sale.date),
                platform: 'bandcamp',
                bandcampOrderId: sale.bandcamp_transaction_id.toString(),
                customerLocation: `${sale.city}, ${sale.country}`,
                notes: `Package: ${sale.package}`,
              },
            });
            processedCount++;
          }
        }
      }
    }

    return {
      success: true,
      salesProcessed: processedCount,
      totalSales: totalSales,
      bandsProcessed: bands.length,
    };
  } catch (error) {
    console.error('Error syncing Bandcamp sales:', error);
    return {
      success: false,
      error: error.message,
    };
  }
};
