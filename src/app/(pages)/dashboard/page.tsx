import { DashboardClient } from './page.client';

export const metadata = {
  title: 'Sales Dashboard',
};

export default function DashboardPage() {
  return (
    <main className='container mx-auto px-4 py-16'>
      <h1 className='text-3xl font-bold mb-8'>Sales Dashboard</h1>
      <DashboardClient />
    </main>
  );
}
