'use client';

import { useEffect, useState } from 'react';
import { SalesDashboard } from '../../_components/SalesDashboard';
import { TicketSalesDashboard } from '../../_components/TicketSalesDashboard';
import { fetchSales } from '../../_api/fetchSales';
import { fetchTicketSales } from '../../_api/fetchTicketSales';
import { useRouter } from 'next/navigation';
import type { Sale, TicketSale } from '../../../payload/payload-types';
import Link from 'next/link';

type ViewMode = 'music' | 'tickets';

export function DashboardClient() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('music');
  const [musicData, setMusicData] = useState<{
    sales: Sale[];
    lastSyncedAt: string | null;
  } | null>(null);
  const [ticketData, setTicketData] = useState<{
    ticketSales: TicketSale[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (viewMode === 'music') {
          const salesData = await fetchSales();
          setMusicData(salesData);
        } else {
          const ticketSalesData = await fetchTicketSales();
          setTicketData(ticketSalesData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
        setError('Failed to load data. Please try logging in again.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [viewMode]);

  const renderToggle = () => (
    <div className='flex items-center justify-between mb-8'>
      <h1 className='text-3xl font-bold'>
        {viewMode === 'music' ? 'Music Sales Dashboard' : 'Ticket Sales Dashboard'}
      </h1>
      <div className='flex rounded-lg border border-gray-300 bg-white shadow-sm'>
        <button
          onClick={() => setViewMode('music')}
          className={`px-6 py-2 text-sm font-medium transition-colors rounded-l-lg ${
            viewMode === 'music'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className='flex items-center gap-2'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3' />
            </svg>
            Music Sales
          </div>
        </button>
        <button
          onClick={() => setViewMode('tickets')}
          className={`px-6 py-2 text-sm font-medium transition-colors rounded-r-lg ${
            viewMode === 'tickets'
              ? 'bg-blue-500 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          <div className='flex items-center gap-2'>
            <svg className='w-5 h-5' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
              <path strokeLinecap='round' strokeLinejoin='round' strokeWidth={2} d='M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' />
            </svg>
            Ticket Sales
          </div>
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        {renderToggle()}
        <div className='bg-white rounded-lg border border-gray-200 p-6 text-center'>
          <p className='text-gray-500'>Loading...</p>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        {renderToggle()}
        <div className='bg-white rounded-lg border border-gray-200 p-6 text-center'>
          <p className='text-gray-500'>
            {error}{' '}
            <Link href='/admin' className='text-blue-500' target='_blank'>
              Login to CMS
            </Link>
          </p>
        </div>
      </>
    );
  }

  if (viewMode === 'music') {
    if (!musicData || musicData.sales.length === 0) {
      return (
        <>
          {renderToggle()}
          <div className='bg-white rounded-lg border border-gray-200 p-6 text-center'>
            <p className='text-gray-500'>
              No music sales data available. Please{' '}
              <Link href='/admin' className='text-blue-500' target='_blank'>
                login
              </Link>{' '}
              to the CMS and refresh the page to access data.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        {renderToggle()}
        <SalesDashboard
          initialSales={musicData.sales}
          lastSyncedAt={musicData.lastSyncedAt}
        />
      </>
    );
  } else {
    if (!ticketData || ticketData.ticketSales.length === 0) {
      return (
        <>
          {renderToggle()}
          <div className='bg-white rounded-lg border border-gray-200 p-6 text-center'>
            <p className='text-gray-500'>
              No ticket sales data available. Please{' '}
              <Link href='/admin' className='text-blue-500' target='_blank'>
                login
              </Link>{' '}
              to the CMS and refresh the page to access data.
            </p>
          </div>
        </>
      );
    }

    return (
      <>
        {renderToggle()}
        <TicketSalesDashboard initialTicketSales={ticketData.ticketSales} />
      </>
    );
  }
}
