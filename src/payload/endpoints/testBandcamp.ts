import { Endpoint } from 'payload/config';
import { fetchBands, fetchSalesForBand } from '../services/bandcamp';

export const testBandcampEndpoint: Endpoint = {
  path: '/test-bandcamp',
  method: 'get',
  handler: async (req, res) => {
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
            endDate
          );
          return {
            band: {
              id: band.band_id,
              name: band.name,
              subdomain: band.subdomain,
            },
            sales: salesData,
          };
        })
      );

      res.status(200).json({
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
      res.status(500).json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  },
};
