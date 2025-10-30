'use client';

import { formatCurrency } from '../../_utilities/formatters';
import type { TicketSale, Event } from '../../../payload/payload-types';

interface TicketSalesTableProps {
  ticketSales: TicketSale[];
  sortBy: string;
  sortDirection: 'asc' | 'desc';
  onSort: (column: string) => void;
}

export function TicketSalesTable({
  ticketSales,
  sortBy,
  sortDirection,
  onSort,
}: TicketSalesTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getEventTitle = (event: string | Event | null | undefined) => {
    if (!event) return 'N/A';
    if (typeof event === 'string') return 'Event ID: ' + event;
    return event.title || 'Unknown Event';
  };

  const getTotalQuantity = (ticketSale: TicketSale) => {
    return ticketSale.tickets.reduce((total, ticket) => total + (ticket.quantity || 0), 0);
  };

  const columns = [
    { key: 'createdAt', label: 'Date' },
    { key: 'ticketNumber', label: 'Ticket #' },
    { key: 'customerEmail', label: 'Customer' },
    { key: 'event', label: 'Event' },
    { key: 'ticketTier', label: 'Tier' },
    { key: 'quantity', label: 'Qty' },
    { key: 'total', label: 'Total' },
    { key: 'status', label: 'Status' },
    { key: 'paymentStatus', label: 'Payment' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'used':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (ticketSales.length === 0) {
    return (
      <div className='bg-white rounded-lg border border-gray-200 p-8 text-center'>
        <p className='text-gray-500'>No ticket sales found</p>
      </div>
    );
  }

  return (
    <div className='overflow-x-auto rounded-lg border border-gray-200 shadow-sm'>
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
          {ticketSales.map((ticketSale) => (
            <tr key={ticketSale.id} className='hover:bg-gray-50'>
              <td className='px-6 py-4 whitespace-nowrap text-sm'>
                {formatDate(ticketSale.createdAt)}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-mono'>
                {ticketSale.ticketNumber}
              </td>
              <td className='px-6 py-4 text-sm'>
                <div>
                  <p className='font-medium'>{ticketSale.firstName} {ticketSale.lastName}</p>
                  <p className='text-xs text-gray-500'>{ticketSale.customerEmail}</p>
                </div>
              </td>
              <td className='px-6 py-4 text-sm max-w-xs truncate'>
                {getEventTitle(ticketSale.event)}
              </td>
              <td className='px-6 py-4 text-sm'>
                {ticketSale.ticketTier || 'N/A'}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-semibold'>
                {getTotalQuantity(ticketSale)}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm font-medium'>
                {formatCurrency(ticketSale.ticketTotals.total, 'EUR')}
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm'>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    ticketSale.status
                  )}`}
                >
                  {ticketSale.status}
                </span>
              </td>
              <td className='px-6 py-4 whitespace-nowrap text-sm'>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getPaymentStatusColor(
                    ticketSale.paymentStatus
                  )}`}
                >
                  {ticketSale.paymentStatus}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

