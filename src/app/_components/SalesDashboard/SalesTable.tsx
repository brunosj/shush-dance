'use client';

interface SalesTableProps {
  sales: any[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function SalesTable({
  sales,
  sortBy,
  sortDirection,
  onSort,
}: SalesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const columns = [
    { key: 'soldAt', label: 'Date' },
    { key: 'itemName', label: 'Item' },
    { key: 'type', label: 'Type' },
    { key: 'amount', label: 'Gross Amount' },
    { key: 'netAmount', label: 'Net Amount' },
    { key: 'taxAmount', label: 'Tax' },
    { key: 'taxRate', label: 'Tax Rate' },
    { key: 'transactionFee', label: 'Fee' },
  ];

  return (
    <div className='overflow-x-auto rounded-lg border border-gray-200'>
      <table className='min-w-full divide-y divide-gray-200'>
        <thead className='bg-gray-50'>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100'
                onClick={() => onSort(column.key)}
              >
                <div className='flex items-center space-x-1'>
                  <span>{column.label}</span>
                  {sortBy === column.key &&
                    (sortDirection === 'asc' ? (
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M5 15l7-7 7 7'
                        />
                      </svg>
                    ) : (
                      <svg
                        className='w-4 h-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                        xmlns='http://www.w3.org/2000/svg'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2}
                          d='M19 9l-7 7-7-7'
                        />
                      </svg>
                    ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className='bg-white divide-y divide-gray-200'>
          {sales.map((sale) => (
            <tr key={sale.id} className='hover:bg-gray-50'>
              <td className='px-6 py-4 whitespace-nowrap text-sm'>
                {formatDate(sale.soldAt)}
              </td>
              <td className='px-6 py-4 text-sm'>{sale.itemName}</td>
              <td className='px-6 py-4 text-sm'>
                <span
                  className={`px-2 py-1 rounded-full text-xs ${
                    sale.type === 'record'
                      ? 'bg-blue-100 text-blue-800'
                      : sale.type === 'merch'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-purple-100 text-purple-800'
                  }`}
                >
                  {sale.type}
                </span>
              </td>
              <td className='px-6 py-4 text-sm'>
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: sale.currency,
                }).format(sale.amount)}
              </td>
              <td className='px-6 py-4 text-sm'>
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: sale.currency,
                }).format(sale.netAmount)}
              </td>
              <td className='px-6 py-4 text-sm'>
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: sale.currency,
                }).format(sale.taxAmount)}
              </td>
              <td className='px-6 py-4 text-sm'>{sale.taxRate}%</td>
              <td className='px-6 py-4 text-sm'>
                {new Intl.NumberFormat('de-DE', {
                  style: 'currency',
                  currency: sale.currency,
                }).format(sale.transactionFee)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
