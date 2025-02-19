import { SalesDashboard } from '../../_components/SalesDashboard';
import { fetchSales } from '../../_api/fetchSales';

export const metadata = {
  title: 'Sales Dashboard',
};

export default async function DashboardPage() {
  const sales = await fetchSales();

  return (
    <main className='container mx-auto px-4 py-8'>
      <h1 className='text-3xl font-bold mb-8'>
        {sales.length > 0 ? 'Sales Dashboard' : 'No sales yet'}
      </h1>
      <SalesDashboard initialSales={sales} />
    </main>
  );
}
