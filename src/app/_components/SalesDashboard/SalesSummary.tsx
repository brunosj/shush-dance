'use client';

import { formatCurrency } from '../../_utilities/formatters';
import type { Sale } from '../../../payload-types';

interface SalesSummaryProps {
  sales: Sale[];
}

export function SalesSummary({ sales }: SalesSummaryProps) {
  // Debug log to check input sales
  console.log('Sales data:', {
    totalSales: sales.length,
    firstSale: sales[0],
    sampleTotals: sales.slice(0, 3).map((s) => ({
      itemTotal: s.itemTotal,
      netAmount: s.netAmount,
      currency: s.currency,
    })),
  });

  const summaryByType = sales.reduce((acc, sale) => {
    // Skip invalid sales
    if (!sale || !sale.type) {
      console.warn('Invalid sale detected:', sale);
      return acc;
    }

    const key = `${sale.type}_${sale.currency}`;

    if (!acc[key]) {
      acc[key] = {
        type: sale.type,
        currency: sale.currency || 'EUR',
        totalGross: 0,
        totalNet: 0,
        salesCount: 0,
        itemsCount: 0,
      };
    }

    // Convert string values to numbers if needed
    const itemTotal =
      typeof sale.itemTotal === 'string'
        ? parseFloat(sale.itemTotal)
        : sale.itemTotal || 0;

    const netAmount =
      typeof sale.netAmount === 'string'
        ? parseFloat(sale.netAmount)
        : sale.netAmount || 0;

    const quantity =
      typeof sale.quantity === 'string'
        ? parseInt(sale.quantity)
        : sale.quantity || 1;

    acc[key].totalGross += itemTotal;
    acc[key].totalNet += netAmount;
    acc[key].salesCount += 1;
    acc[key].itemsCount += quantity;

    return acc;
  }, {});

  // Debug log to check calculations
  console.log('Summary calculations:', summaryByType);

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <h2 className='text-lg font-semibold mb-4'>Sales Summary</h2>
      <div className='space-y-6'>
        {Object.values(summaryByType).map((summary: any) => (
          <div
            key={`${summary.type}_${summary.currency}`}
            className='border-b border-gray-100 pb-4 last:border-0'
          >
            <div className='flex justify-between items-center mb-2'>
              <span
                className={`px-2 py-1 rounded-full text-xs ${
                  summary.type === 'record'
                    ? 'bg-blue-100 text-blue-800'
                    : summary.type === 'merch'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                }`}
              >
                {summary.type}
              </span>
              <span className='text-sm text-gray-500'>
                {summary.itemsCount} items ({summary.salesCount} sales)
              </span>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Gross Revenue</p>
                <p className='text-lg font-medium'>
                  {formatCurrency(summary.totalGross, summary.currency)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Net Revenue</p>
                <p className='text-lg font-medium'>
                  {formatCurrency(summary.totalNet, summary.currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <p className='text-xs text-amber-600 mt-2 italic'>
        Note: Gross amounts include shipping costs where applicable
      </p>
    </div>
  );
}
