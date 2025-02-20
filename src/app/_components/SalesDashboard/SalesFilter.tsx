'use client';

import { DateRangePicker } from './DateRangePicker';

interface SalesFiltersProps {
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
  lastSyncedAt?: string;
}

export function SalesFilters({
  dateRange,
  setDateRange,
  selectedTypes,
  setSelectedTypes,
  lastSyncedAt,
}: SalesFiltersProps) {
  const types = ['record', 'merch', 'digital'];

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
        <div className='flex-1'>
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
      </div>
    </div>
  );
}
