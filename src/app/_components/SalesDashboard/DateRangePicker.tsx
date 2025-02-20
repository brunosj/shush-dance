'use client';

interface DateRangePickerProps {
  value: [Date | null, Date | null];
  onChange: (range: [Date | null, Date | null]) => void;
  lastSyncedAt?: string;
}

export function DateRangePicker({
  value,
  onChange,
  lastSyncedAt,
}: DateRangePickerProps) {
  const [startDate, endDate] = value;
  const currentYear = new Date().getFullYear();
  const previousYear = currentYear - 1;

  const getQuarterDates = (year: number, quarter: number): [Date, Date] => {
    const startMonth = (quarter - 1) * 3;
    const start = new Date(year, startMonth, 1);
    const end = new Date(year, startMonth + 3, 0);
    return [start, end];
  };

  const setPresetRange = (preset: string) => {
    switch (preset) {
      case 'previousYear':
        onChange([
          new Date(previousYear, 0, 1),
          new Date(previousYear, 11, 31),
        ]);
        break;
      case 'currentYear':
        onChange([new Date(currentYear, 0, 1), new Date()]);
        break;
      case `${currentYear}-Q1`:
        onChange(getQuarterDates(currentYear, 1));
        break;
      case `${currentYear}-Q2`:
        onChange(getQuarterDates(currentYear, 2));
        break;
      case `${currentYear}-Q3`:
        onChange(getQuarterDates(currentYear, 3));
        break;
      case `${currentYear}-Q4`:
        onChange(getQuarterDates(currentYear, 4));
        break;
    }
  };

  // Format date for display
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('de-DE', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className='space-y-4'>
      <div className='flex flex-wrap gap-2'>
        <button
          onClick={() => setPresetRange('previousYear')}
          className={`px-3 py-1 text-sm rounded-full transition-colors
            ${
              startDate?.getFullYear() === previousYear
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
        >
          {previousYear}
        </button>
        <button
          onClick={() => setPresetRange('currentYear')}
          className={`px-3 py-1 text-sm rounded-full transition-colors
            ${
              startDate?.getFullYear() === currentYear
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
        >
          {currentYear}
        </button>
        {[1, 2, 3, 4].map((quarter) => (
          <button
            key={quarter}
            onClick={() => setPresetRange(`${currentYear}-Q${quarter}`)}
            className={`px-3 py-1 text-sm rounded-full transition-colors
              ${
                startDate?.getFullYear() === currentYear &&
                Math.floor(startDate.getMonth() / 3) === quarter - 1
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
          >
            Q{quarter}
          </button>
        ))}
      </div>

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

      <div className='text-sm text-gray-500'>
        {startDate && endDate ? (
          <p className='text-sm text-gray-500'>
            Showing data from {formatDate(startDate)} to {formatDate(endDate)}
          </p>
        ) : (
          <p className='text-sm text-gray-500'>
            Select a date range to filter sales
          </p>
        )}
        <p className='mt-2 text-xs text-amber-600'>
          {lastSyncedAt
            ? `Sales data is synced until ${formatDateTime(lastSyncedAt)}. Visit the CMS to sync more recent data.`
            : 'Sales data sync status unknown. Visit the CMS to sync data.'}
        </p>
      </div>
    </div>
  );
}
