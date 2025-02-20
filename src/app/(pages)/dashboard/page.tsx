import { SalesDashboard } from '../../_components/SalesDashboard';
import { fetchSales } from '../../_api/fetchSales';

export const metadata = {
  title: 'Sales Dashboard',
};

export default async function DashboardPage() {
  const data = await fetchSales();
  if (!data || data.sales.length === 0) {
    return (
      <main className='container mx-auto px-4 py-16'>
        <h1 className='text-3xl font-bold mb-8'>Sales Dashboard</h1>
        <div className='bg-white rounded-lg border border-gray-200 p-6 text-center'>
          <p className='text-gray-500'>No sales data available.</p>
        </div>
      </main>
    );
  }

  return (
    <main className='container mx-auto px-4 py-16'>
      <h1 className='text-3xl font-bold mb-8'>Sales Dashboard</h1>
      <SalesDashboard
        initialSales={data.sales}
        lastSyncedAt={data.lastSyncedAt}
      />
    </main>
  );
}
