'use client';

import { DateRangePicker } from './DateRangePicker';

interface SalesFiltersProps {
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
  selectedTypes: string[];
  setSelectedTypes: (types: string[]) => void;
}

export function SalesFilters({
  dateRange,
  setDateRange,
  selectedTypes,
  setSelectedTypes,
}: SalesFiltersProps) {
  const types = ['record', 'merch', 'digital'];

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <div className='flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6'>
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Date Range
          </label>
          <DateRangePicker value={dateRange} onChange={setDateRange} />
        </div>
        <div className='flex-1'>
          <label className='block text-sm font-medium text-gray-700 mb-2'>
            Sale Type
          </label>
          <div className='flex flex-wrap gap-2'>
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
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTypes.includes(type)
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
