import { Endpoint } from 'payload/config';
import { fetchBands, fetchSalesForBand } from '../services/bandcamp';

async function findRelatedRelease(
  payload: any,
  sale: any
): Promise<string | null> {
  if (!sale.catalog_number) return null;

  // Clean up catalog number for comparison
  const cleanCatalogNumber = sale.catalog_number.trim().toLowerCase();

  // Try exact match first
  const exactMatch = await payload.find({
    collection: 'releases',
    where: {
      catalogNumber: {
        equals: cleanCatalogNumber,
      },
    },
  });

  if (exactMatch.docs[0]?.id) {
    return exactMatch.docs[0].id;
  }

  // Try fuzzy match if exact match fails
  // This handles cases where catalog numbers might have slight variations
  // e.g., "ABC-123" vs "ABC123" vs "ABC 123"
  const fuzzyMatch = await payload.find({
    collection: 'releases',
    where: {
      catalogNumber: {
        like: cleanCatalogNumber.replace(/[-\s]/g, ''),
      },
    },
  });

  return fuzzyMatch.docs[0]?.id || null;
}

async function findRelatedMerchItem(
  payload: any,
  sale: any
): Promise<string | null> {
  if (!sale.item_type || !sale.item_name) return null;

  // Clean and normalize the item name from bandcamp
  // Remove artist name if it exists (typically after " by " in bandcamp titles)
  const cleanItemName = sale.item_name
    .split(' by ')[0] // Remove everything after " by "
    .trim()
    .toLowerCase();

  const cleanItemType = sale.item_type.trim().toLowerCase();

  // Try exact match first
  const exactMatch = await payload.find({
    collection: 'merch',
    where: {
      and: [
        {
          itemType: {
            equals: cleanItemType,
          },
        },
        {
          title: {
            equals: cleanItemName,
          },
        },
      ],
    },
  });

  if (exactMatch.docs[0]?.id) {
    return exactMatch.docs[0].id;
  }

  // Try partial match if exact match fails
  // This helps with slight variations in naming
  const partialMatch = await payload.find({
    collection: 'merch',
    where: {
      and: [
        {
          itemType: {
            like: cleanItemType,
          },
        },
        {
          title: {
            like: cleanItemName,
          },
        },
      ],
    },
  });

  if (partialMatch.docs[0]?.id) {
    return partialMatch.docs[0].id;
  }

  // Try matching just by title if both previous attempts fail
  // This helps when item types might be categorized differently
  const titleOnlyMatch = await payload.find({
    collection: 'merch',
    where: {
      title: {
        like: cleanItemName,
      },
    },
  });

  if (!titleOnlyMatch.docs[0]?.id) {
    // Log the attempted matches for debugging
    console.warn('Failed to match merch item:', {
      originalName: sale.item_name,
      cleanedName: cleanItemName,
      itemType: cleanItemType,
      attempted: {
        exactMatch: exactMatch.docs,
        partialMatch: partialMatch.docs,
        titleOnlyMatch: titleOnlyMatch.docs,
      },
    });
  }

  return titleOnlyMatch.docs[0]?.id || null;
}

// Add a logging function to track unmatched items
async function logUnmatchedItem(
  payload: any,
  sale: any,
  type: 'release' | 'merch'
): Promise<void> {
  console.warn(`Unmatched ${type} item:`, {
    itemName: sale.item_name,
    itemType: sale.item_type,
    catalogNumber: sale.catalog_number,
    package: sale.package,
    bandcampTransactionId: sale.bandcamp_transaction_id,
  });
}

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
                // Find related items
                const itemType = determineItemType(
                  sale.item_type,
                  sale.package || ''
                );

                let cmsItem = null;
                if (itemType === 'record') {
                  const releaseId = await findRelatedRelease(req.payload, sale);
                  if (releaseId) {
                    cmsItem = { relationTo: 'releases', value: releaseId };
                  } else {
                    await logUnmatchedItem(req.payload, sale, 'release');
                  }
                } else if (itemType === 'merch') {
                  const merchId = await findRelatedMerchItem(req.payload, sale);
                  if (merchId) {
                    cmsItem = { relationTo: 'merch', value: merchId };
                  } else {
                    await logUnmatchedItem(req.payload, sale, 'merch');
                  }
                }

                await req.payload.create({
                  collection: 'sales',
                  data: {
                    // Basic Item Information
                    itemName: sale.item_name,
                    artist: sale.artist,
                    cmsItem,
                    itemType: sale.item_type,
                    package: sale.package,
                    option: sale.option,
                    type: itemType,
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
                    taxRate: sale.tax_rate / 100 || 0,
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
