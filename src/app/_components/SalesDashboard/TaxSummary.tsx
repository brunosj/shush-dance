'use client';

import { useState } from 'react';
import { formatCurrency, formatNumber } from '../../_utilities/formatters';
import type { Sale } from '../../../payload/payload-types';

interface TaxSummaryProps {
  sales: Sale[];
  selectedCountry: string | null;
}

export function TaxSummary({ sales, selectedCountry }: TaxSummaryProps) {
  const [showAll, setShowAll] = useState(false);
  const INITIAL_DISPLAY_COUNT = 3;

  // Filter sales based on selected country
  const filteredSales = selectedCountry
    ? sales.filter((sale) => sale.countryCode === selectedCountry)
    : sales;

  const taxSummary = filteredSales.reduce((acc, sale) => {
    const key = `${sale.taxRate}_${sale.currency}`;
    const taxAmount = (sale.sellerTax || 0) + (sale.marketplaceTax || 0);

    if (!acc[key]) {
      acc[key] = {
        taxRate: sale.taxRate || 0,
        currency: sale.currency || 'EUR',
        totalTax: 0,
        totalNet: 0,
        totalGross: 0,
        count: 0,
      };
    }
    acc[key].totalTax += taxAmount;
    acc[key].totalNet += sale.netAmount || 0;
    acc[key].totalGross += sale.itemTotal || 0;
    acc[key].count += 1;
    return acc;
  }, {});

  if (Object.keys(taxSummary).length === 0) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-6'>
        <h2 className='text-lg font-semibold mb-4'>
          {selectedCountry ? 'German Tax Summary' : 'Tax Summary'}
        </h2>
        <p className='text-gray-500 text-center'>No tax data available</p>
      </div>
    );
  }

  // Sort tax rates by count (most transactions first)
  const sortedSummaries = Object.values(taxSummary).sort(
    (a: any, b: any) => b.count - a.count
  );

  // Slice the array based on showAll state
  const displayedSummaries = showAll
    ? sortedSummaries
    : sortedSummaries.slice(0, INITIAL_DISPLAY_COUNT);

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <h2 className='text-lg font-semibold mb-4'>
        {selectedCountry ? 'German Tax Summary' : 'Tax Summary'}
      </h2>
      <div className='space-y-6'>
        {displayedSummaries.map((summary: any) => (
          <div
            key={`${summary.taxRate}_${summary.currency}`}
            className='border-b border-gray-100 pb-4 last:border-0'
          >
            <div className='flex justify-between items-center mb-2'>
              <span className='font-medium'>{summary.taxRate}% Tax Rate</span>
              <span className='text-sm text-gray-500'>
                {summary.count} transactions
              </span>
            </div>
            <div className='grid grid-cols-3 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Net Amount</p>
                <p className='text-lg font-medium'>
                  {formatCurrency(summary.totalNet, summary.currency)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Tax Amount</p>
                <p className='text-lg font-medium'>
                  {formatCurrency(summary.totalTax, summary.currency)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Gross Amount</p>
                <p className='text-lg font-medium'>
                  {formatCurrency(summary.totalGross, summary.currency)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sortedSummaries.length > INITIAL_DISPLAY_COUNT && (
        <div className='mt-4 text-center'>
          <button
            onClick={() => setShowAll(!showAll)}
            className='text-blue-500 hover:text-blue-600 text-sm font-medium'
          >
            {showAll
              ? 'Show Less'
              : `Show ${sortedSummaries.length - INITIAL_DISPLAY_COUNT} More`}
          </button>
        </div>
      )}
    </div>
  );
}
