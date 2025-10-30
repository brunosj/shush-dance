'use client';

import { useState, useMemo } from 'react';
import { SalesFilters } from './SalesFilter';
import { SalesSummary } from './SalesSummary';
import { SalesTable } from './SalesTable';
import { TaxSummary } from './TaxSummary';
import type { Sale } from '../../../payload-types';

interface SalesDashboardProps {
  initialSales: Sale[];
  lastSyncedAt?: string;
}

export function SalesDashboard({
  initialSales,
  lastSyncedAt,
}: SalesDashboardProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<string>('soldAt');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [selectedPointsOfSale, setSelectedPointsOfSale] = useState<string[]>(
    []
  );

  const filteredSales = useMemo(() => {
    return initialSales.filter((sale) => {
      const matchesType =
        selectedTypes.length === 0 || selectedTypes.includes(sale.type);
      const matchesPointOfSale =
        selectedPointsOfSale.length === 0 ||
        selectedPointsOfSale.includes(sale.pointOfSale);
      const matchesDate =
        !dateRange[0] ||
        !dateRange[1] ||
        (new Date(sale.soldAt) >= dateRange[0] &&
          new Date(sale.soldAt) <= dateRange[1]);
      const matchesCountry =
        !selectedCountry || sale.countryCode === selectedCountry;

      return matchesType && matchesPointOfSale && matchesDate && matchesCountry;
    });
  }, [
    initialSales,
    selectedTypes,
    selectedPointsOfSale,
    dateRange,
    selectedCountry,
  ]);

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
        selectedCountry={selectedCountry}
        setSelectedCountry={setSelectedCountry}
        lastSyncedAt={lastSyncedAt}
        selectedPointsOfSale={selectedPointsOfSale}
        setSelectedPointsOfSale={setSelectedPointsOfSale}
      />

      <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>
        <SalesSummary sales={sortedSales} />
        <TaxSummary sales={sortedSales} selectedCountry={selectedCountry} />
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
