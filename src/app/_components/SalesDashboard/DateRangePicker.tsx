'use client';

interface DateRangePickerProps {
  value: [Date | null, Date | null];
  onChange: (range: [Date | null, Date | null]) => void;
}

export function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [startDate, endDate] = value;

  return (
    <div className='flex items-center space-x-4'>
      <div>
        <label className='block text-sm text-gray-500 mb-1'>From</label>
        <input
          type='date'
          value={startDate ? startDate.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            onChange([newDate, endDate]);
          }}
          className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
        />
      </div>
      <div>
        <label className='block text-sm text-gray-500 mb-1'>To</label>
        <input
          type='date'
          value={endDate ? endDate.toISOString().split('T')[0] : ''}
          onChange={(e) => {
            const newDate = e.target.value ? new Date(e.target.value) : null;
            onChange([startDate, newDate]);
          }}
          min={startDate ? startDate.toISOString().split('T')[0] : undefined}
          className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm'
        />
      </div>
      {(startDate || endDate) && (
        <button
          onClick={() => onChange([null, null])}
          className='mt-6 px-3 py-2 text-sm text-gray-600 hover:text-gray-900'
        >
          Clear
        </button>
      )}
    </div>
  );
}
