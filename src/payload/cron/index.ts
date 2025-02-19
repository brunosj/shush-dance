// import cron from 'node-cron';
// import { syncBandcampSales } from './fetchBandcampSales';

// // Run every 2 weeks on Monday at 1 AM
// export const initCronJobs = () => {
//   cron.schedule('0 1 */14 * *', async () => {
//     console.log('Running scheduled Bandcamp sales sync...');
//     try {
//       const result = await syncBandcampSales();
//       console.log('Bandcamp sync completed:', result);
//     } catch (error) {
//       console.error('Bandcamp sync failed:', error);
//     }
//   });
// };
