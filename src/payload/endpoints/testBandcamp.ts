import type { Endpoint } from 'payload';

import { fetchBands, fetchSalesForBand } from '../services/bandcamp';

export const testBandcampEndpoint: Endpoint = {
  path: '/test-bandcamp',
  method: 'get',
  handler: async (req) => {
    try {
      // Test last 30 days of sales
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 60);

      // First fetch all bands
      const bands = await fetchBands();

      // Then fetch sales for each band
      const salesByBand = await Promise.all(
        bands.map(async (band) => {
          const salesData = await fetchSalesForBand(
            band.band_id,
            startDate,
            endDate,
          );
          return {
            band: {
              id: band.band_id,
              name: band.name,
              subdomain: band.subdomain,
            },
            sales: salesData,
          };
        }),
      );

      return Response.json({
        success: true,
        message: 'Successfully connected to Bandcamp API',
        timestamp: new Date().toISOString(),
        dateRange: {
          from: startDate.toISOString(),
          to: endDate.toISOString(),
        },
        bands: bands.length,
        response: salesByBand,
      });
    } catch (error) {
      console.error('Bandcamp API Test Error:', error);
      return Response.json(
        {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
        },
        { status: 500 },
      );
    }
  },
};
