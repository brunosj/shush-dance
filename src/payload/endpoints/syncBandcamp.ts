import { Endpoint } from 'payload/config';
import { fetchBands, fetchSalesForBand } from '../services/bandcamp';

export const syncBandcampEndpoint: Endpoint = {
  path: '/sync-bandcamp',
  method: 'post',
  handler: async (req, res) => {
    try {
      // Fetch bands
      const bands = await fetchBands();
      console.log(`Found ${bands.length} bands`);

      let totalFound = 0;
      let totalCreated = 0;

      // Define the start and end dates
      const startDate = new Date('2024-01-01');
      const endDate = new Date();

      // Process each band
      for (const band of bands) {
        // Fetch sales with the specified date range
        const salesData = await fetchSalesForBand(
          band.band_id,
          startDate,
          endDate
        );

        console.log(
          `Processing ${salesData?.report?.length || 0} sales for ${band.name}`
        );

        if (salesData?.report && Array.isArray(salesData.report)) {
          totalFound += salesData.report.length;

          // Process each sale
          for (const sale of salesData.report) {
            // Validate required fields
            if (!sale.bandcamp_transaction_item_id || !sale.item_name) {
              console.warn('Skipping sale due to missing required fields:', {
                bandcamp_transaction_item_id: sale.bandcamp_transaction_item_id,
                item_name: sale.item_name,
                sale_data: sale,
              });
              continue;
            }

            // Check if sale exists using transaction item ID
            const existingSale = await req.payload.find({
              collection: 'sales',
              where: {
                bandcampTransactionItemId: {
                  equals: sale.bandcamp_transaction_item_id.toString(),
                },
              },
            });

            if (existingSale.totalDocs === 0) {
              try {
                await req.payload.create({
                  collection: 'sales',
                  data: {
                    // Basic Item Information
                    itemName: sale.item_name,
                    artist: sale.artist,
                    itemType: sale.item_type,
                    package: sale.package,
                    option: sale.option,
                    type: determineItemType(sale.item_type, sale.package || ''),
                    pointOfSale: 'bandcamp',

                    // Financial Information
                    itemPrice: sale.item_price || 0,
                    quantity: sale.quantity || 1,
                    subTotal: sale.sub_total || 0,
                    currency: sale.currency || 'EUR',
                    additionalFanContribution:
                      sale.additional_fan_contribution || 0,
                    itemTotal: sale.item_total || 0,
                    netAmount: sale.net_amount || 0,
                    transactionFee: sale.transaction_fee || 0,
                    feeType: sale.fee_type,
                    amountYouReceived: sale.amount_you_received || 0,

                    // Tax and Shipping
                    sellerTax: sale.seller_tax || 0,
                    marketplaceTax: sale.marketplace_tax || 0,
                    taxRate: sale.tax_rate || 0,
                    shipping: sale.shipping || 0,

                    // Customer Information
                    buyerName: sale.buyer_name || '',
                    buyerEmail: sale.buyer_email || '',
                    buyerPhone: sale.buyer_phone || '',

                    // Location Information
                    city: sale.city || '',
                    regionOrState: sale.region_or_state || '',
                    country: sale.country || '',
                    countryCode: sale.country_code || '',

                    // Transaction IDs
                    bandcampTransactionId:
                      sale.bandcamp_transaction_id?.toString(),
                    bandcampTransactionItemId:
                      sale.bandcamp_transaction_item_id.toString(),
                    bandcampRelatedTransactionId:
                      sale.bandcamp_related_transaction_id?.toString(),

                    // Additional Fields
                    itemUrl: sale.item_url || '',
                    referer: sale.referer || '',
                    refererUrl: sale.referer_url || '',
                    catalogNumber: sale.catalog_number || '',
                    upc: sale.upc || '',
                    isrc: sale.isrc || '',
                    buyerNote: sale.buyer_note || '',
                    soldAt: new Date(sale.date),
                  },
                });
                totalCreated++;
              } catch (error) {
                console.error('Error creating sale:', {
                  error,
                  sale_data: sale,
                  band: band,
                });
                // Continue processing other sales even if one fails
                continue;
              }
            }
          }
        }
      }

      // Update the settings global with the sync timestamp
      await req.payload.updateGlobal({
        slug: 'settings',
        data: {
          lastBandcampSync: new Date().toISOString(),
        },
      });

      res.status(200).json({
        success: true,
        totalSales: totalFound,
        newSales: totalCreated,
        bandsProcessed: bands.length,
        syncedAt: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Sync error:', error);
      res.status(500).json({
        success: false,
        error: error.message,
      });
    }
  },
};

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
