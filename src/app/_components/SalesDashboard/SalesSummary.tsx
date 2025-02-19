'use client';

interface SalesSummaryProps {
  sales: any[];
}

export function SalesSummary({ sales }: SalesSummaryProps) {
  const summaryByType = sales.reduce((acc, sale) => {
    const key = `${sale.type}_${sale.currency}`;
    if (!acc[key]) {
      acc[key] = {
        type: sale.type,
        currency: sale.currency,
        totalGross: 0,
        totalNet: 0,
        count: 0,
      };
    }
    acc[key].totalGross += sale.amount;
    acc[key].totalNet += sale.netAmount;
    acc[key].count += 1;
    return acc;
  }, {});

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
                {summary.count} sales
              </span>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div>
                <p className='text-sm text-gray-500'>Gross Revenue</p>
                <p className='text-lg font-medium'>
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: summary.currency,
                  }).format(summary.totalGross)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Net Revenue</p>
                <p className='text-lg font-medium'>
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: summary.currency,
                  }).format(summary.totalNet)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
