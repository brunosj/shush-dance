import { DashboardClient } from './page.client';

export const metadata = {
  title: 'Sales Dashboard',
};

export default function DashboardPage() {
  return (
    <main className='container mx-auto px-4 py-16'>
      <DashboardClient />
    </main>
  );
}
