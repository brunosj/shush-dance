'use client';

import { useEffect, useState } from 'react';
import { SalesDashboard } from '../../_components/SalesDashboard';
import { fetchSales } from '../../_api/fetchSales';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function DashboardClient() {
  const router = useRouter();
  const [data, setData] = useState<{
    sales: any[];
    lastSyncedAt: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const salesData = await fetchSales();
        setData(salesData);
      } catch (error) {
        console.error('Failed to fetch sales:', error);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [router]);

  if (loading) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-6 text-center'>
        <p className='text-gray-500'>Loading...</p>
      </div>
    );
  }

  if (!data || data.sales.length === 0) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-6 text-center'>
        <p className='text-gray-500'>
          Please{' '}
          <Link href='/admin' className='text-blue-500'>
            login
          </Link>{' '}
          to the CMS to access data.
        </p>
      </div>
    );
  }

  return (
    <SalesDashboard
      initialSales={data.sales}
      lastSyncedAt={data.lastSyncedAt}
    />
  );
}
