'use client';

import { useState, useMemo } from 'react';
import { SalesFilters } from './SalesFilter';
import { SalesSummary } from './SalesSummary';
import { SalesTable } from './SalesTable';
import { TaxSummary } from './TaxSummary';
import type { Sale } from '../../../payload/payload-types';

interface SalesDashboardProps {
  initialSales: Sale[];
}

export function SalesDashboard({ initialSales }: SalesDashboardProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<string>('soldAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const filteredSales = useMemo(() => {
    return initialSales.filter((sale) => {
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(sale.type);
      const matchesDate =
        !dateRange[0] ||
        !dateRange[1] ||
        (new Date(sale.soldAt) >= dateRange[0] &&
          new Date(sale.soldAt) <= dateRange[1]);

      return matchesType && matchesDate;
    });
  }, [initialSales, selectedTypes, dateRange]);

  const sortedSales = useMemo(() => {
    return [...filteredSales].sort((a, b) => {
      const aValue = a[sortBy as keyof Sale];
      const bValue = b[sortBy as keyof Sale];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    });
  }, [filteredSales, sortBy, sortDirection]);

  return (
    <div className='space-y-8'>
      <SalesFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedTypes={selectedTypes}
        setSelectedTypes={setSelectedTypes}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <SalesSummary sales={sortedSales} />
        <TaxSummary sales={sortedSales} />
      </div>

      <SalesTable
        sales={sortedSales}
        sortBy={sortBy}
        sortDirection={sortDirection}
        onSort={(column) => {
          if (column === sortBy) {
            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
          } else {
            setSortBy(column);
            setSortDirection('desc');
          }
        }}
      />
    </div>
  );
}
