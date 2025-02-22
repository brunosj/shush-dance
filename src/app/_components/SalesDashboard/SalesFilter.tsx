'use client';

import { DateRangePicker } from './DateRangePicker';

interface SalesFiltersProps {
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  selectedPointsOfSale: string[];
  setSelectedPointsOfSale: (pos: string[]) => void;
  selectedCountry: string | null;
  setSelectedCountry: (country: string | null) => void;
  lastSyncedAt?: string;
}

export function SalesFilters({
  dateRange,
  setDateRange,
  selectedTypes,
  setSelectedTypes,
  selectedPointsOfSale,
  setSelectedPointsOfSale,
  selectedCountry,
  setSelectedCountry,
  lastSyncedAt,
}: SalesFiltersProps) {
  const types = ['record', 'merch', 'digital'];
  const pointsOfSale = ['bandcamp', 'paypal', 'in-person', 'promo'];

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6 shadow-sm'>
      <div className='flex flex-col md:flex-row md:items-start space-y-4 md:space-y-0 md:space-x-6'>
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            Date Range
          </label>
          <div className='bg-white rounded-md'>
            <DateRangePicker
              value={dateRange}
              onChange={setDateRange}
              lastSyncedAt={lastSyncedAt}
            />
          </div>
        </div>
        <div className='flex-1 flex flex-col space-y-4 md:space-y-8'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Sale Type
            </label>
            <div className='flex flex-wrap gap-2 rounded-md'>
              {types.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    if (selectedTypes.includes(type)) {
                      setSelectedTypes(selectedTypes.filter((t) => t !== type));
                    } else {
                      setSelectedTypes([...selectedTypes, type]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${
                      selectedTypes.includes(type)
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Point of Sale
            </label>
            <div className='flex flex-wrap gap-2 rounded-md'>
              {pointsOfSale.map((pos) => (
                <button
                  key={pos}
                  onClick={() => {
                    if (selectedPointsOfSale.includes(pos)) {
                      setSelectedPointsOfSale(
                        selectedPointsOfSale.filter((p) => p !== pos)
                      );
                    } else {
                      setSelectedPointsOfSale([...selectedPointsOfSale, pos]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${
                      selectedPointsOfSale.includes(pos)
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {pos
                    .split('-')
                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                    .join('-')}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className='w-40'>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            Country
          </label>
          <div className='flex flex-wrap gap-2 rounded-md'>
            <button
              onClick={() =>
                setSelectedCountry(selectedCountry === 'DE' ? null : 'DE')
              }
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                ${
                  selectedCountry === 'DE'
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
            >
              Germany
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
