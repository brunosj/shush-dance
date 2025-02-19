'use client';

interface TaxSummaryProps {
  sales: any[];
}

export function TaxSummary({ sales }: TaxSummaryProps) {
  const taxSummary = sales.reduce((acc, sale) => {
    const key = `${sale.taxRate}_${sale.currency}`;
    if (!acc[key]) {
      acc[key] = {
        taxRate: sale.taxRate,
        currency: sale.currency,
        totalTax: 0,
        totalNet: 0,
        totalGross: 0,
        count: 0,
      };
    }
    acc[key].totalTax += sale.taxAmount;
    acc[key].totalNet += sale.netAmount;
    acc[key].totalGross += sale.amount;
    acc[key].count += 1;
    return acc;
  }, {});

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <h2 className='text-lg font-semibold mb-4'>Tax Summary</h2>
      <div className='space-y-6'>
        {Object.values(taxSummary).map((summary: any) => (
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
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: summary.currency,
                  }).format(summary.totalNet)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Tax Amount</p>
                <p className='text-lg font-medium'>
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: summary.currency,
                  }).format(summary.totalTax)}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-500'>Gross Amount</p>
                <p className='text-lg font-medium'>
                  {new Intl.NumberFormat('de-DE', {
                    style: 'currency',
                    currency: summary.currency,
                  }).format(summary.totalGross)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
