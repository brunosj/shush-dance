'use client';

import { DateRangePicker } from '../SalesDashboard/DateRangePicker';
import type { TicketSale, Event } from '../../../payload/payload-types';

interface TicketSalesFiltersProps {
  dateRange: [Date | null, Date | null];
  setDateRange: (range: [Date | null, Date | null]) => void;
  selectedStatuses: string[];
  setSelectedStatuses: (statuses: string[]) => void;
  selectedPaymentStatuses: string[];
  setSelectedPaymentStatuses: (statuses: string[]) => void;
  selectedEvent: string | null;
  setSelectedEvent: (event: string | null) => void;
  allTicketSales: TicketSale[];
}

export function TicketSalesFilters({
  dateRange,
  setDateRange,
  selectedStatuses,
  setSelectedStatuses,
  selectedPaymentStatuses,
  setSelectedPaymentStatuses,
  selectedEvent,
  setSelectedEvent,
  allTicketSales,
}: TicketSalesFiltersProps) {
  const statuses = ['active', 'used', 'cancelled', 'refunded'];
  const paymentStatuses = ['pending', 'paid', 'failed', 'refunded'];

  // Extract unique events from ticket sales
  const events = allTicketSales.reduce((acc, ticketSale) => {
    if (ticketSale.event) {
      let eventId: string;
      let eventTitle: string;
      
      if (typeof ticketSale.event === 'string') {
        eventId = ticketSale.event;
        eventTitle = ticketSale.eventTitle || 'Unknown Event';
      } else if (typeof ticketSale.event === 'object' && ticketSale.event !== null) {
        eventId = ticketSale.event.id;
        eventTitle = ticketSale.event.title || 'Unknown Event';
      } else {
        return acc;
      }
      
      if (!acc.find(e => e.id === eventId)) {
        acc.push({ id: eventId, title: eventTitle });
      }
    }
    return acc;
  }, [] as { id: string; title: string }[]);

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
            />
          </div>
        </div>
        
        <div className='flex-1 flex flex-col space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Ticket Status
            </label>
            <div className='flex flex-wrap gap-2 rounded-md'>
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    if (selectedStatuses.includes(status)) {
                      setSelectedStatuses(selectedStatuses.filter((s) => s !== status));
                    } else {
                      setSelectedStatuses([...selectedStatuses, status]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${
                      selectedStatuses.includes(status)
                        ? 'bg-blue-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
          
          <div>
            <label className='block text-sm font-medium text-gray-700 mb-3'>
              Payment Status
            </label>
            <div className='flex flex-wrap gap-2 rounded-md'>
              {paymentStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    if (selectedPaymentStatuses.includes(status)) {
                      setSelectedPaymentStatuses(
                        selectedPaymentStatuses.filter((s) => s !== status)
                      );
                    } else {
                      setSelectedPaymentStatuses([...selectedPaymentStatuses, status]);
                    }
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors
                    ${
                      selectedPaymentStatuses.includes(status)
                        ? 'bg-green-500 text-white shadow-sm'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className='w-64'>
          <label className='block text-sm font-medium text-gray-700 mb-3'>
            Event
          </label>
          <select
            value={selectedEvent || ''}
            onChange={(e) => setSelectedEvent(e.target.value || null)}
            className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm'
          >
            <option value=''>All Events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

