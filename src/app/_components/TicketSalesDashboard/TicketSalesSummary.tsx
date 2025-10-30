'use client';

import { useState } from 'react';
import { formatCurrency } from '../../_utilities/formatters';
import type { TicketSale, Event } from '../../../payload/payload-types';
import * as XLSX from 'xlsx';

interface TicketSalesSummaryProps {
  ticketSales: TicketSale[];
}

interface EventTierSummary {
  eventId: string;
  eventTitle: string;
  eventDate?: string | null;
  eventLocation?: string | null;
  tiers: {
    [tierName: string]: {
      quantity: number;
      revenue: number;
      salesCount: number;
    };
  };
  totalQuantity: number;
  totalRevenue: number;
  totalSales: number;
  tickets: TicketSale[];
}

export function TicketSalesSummary({ ticketSales }: TicketSalesSummaryProps) {
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  const toggleEventExpansion = (eventId: string) => {
    const newExpanded = new Set(expandedEvents);
    if (newExpanded.has(eventId)) {
      newExpanded.delete(eventId);
    } else {
      newExpanded.add(eventId);
    }
    setExpandedEvents(newExpanded);
  };

  // Aggregate ticket sales by event and tier
  const eventSummaries = ticketSales.reduce(
    (acc, ticketSale) => {
      // Skip if no event or payment not complete
      if (!ticketSale.event || ticketSale.paymentStatus !== 'paid') {
        return acc;
      }

      let eventId: string;
      let eventTitle: string;

      if (typeof ticketSale.event === 'string') {
        eventId = ticketSale.event;
        eventTitle = ticketSale.eventTitle || 'Unknown Event';
      } else if (
        typeof ticketSale.event === 'object' &&
        ticketSale.event !== null
      ) {
        eventId = ticketSale.event.id;
        eventTitle = ticketSale.event.title || 'Unknown Event';
      } else {
        return acc;
      }

      if (!acc[eventId]) {
        acc[eventId] = {
          eventId,
          eventTitle,
          eventDate: ticketSale.eventDate,
          eventLocation: ticketSale.eventLocation,
          tiers: {},
          totalQuantity: 0,
          totalRevenue: 0,
          totalSales: 0,
          tickets: [],
        };
      }

      // Add ticket sale to the event's tickets array
      acc[eventId].tickets.push(ticketSale);

      // Process each ticket in the tickets array
      ticketSale.tickets.forEach((ticket) => {
        const tierName = ticket.ticketName || 'Unknown Tier';

        if (!acc[eventId].tiers[tierName]) {
          acc[eventId].tiers[tierName] = {
            quantity: 0,
            revenue: 0,
            salesCount: 0,
          };
        }

        const quantity = ticket.quantity || 0;
        const lineTotal = ticket.lineTotal || 0;

        acc[eventId].tiers[tierName].quantity += quantity;
        acc[eventId].tiers[tierName].revenue += lineTotal;
        acc[eventId].tiers[tierName].salesCount += 1;

        acc[eventId].totalQuantity += quantity;
        acc[eventId].totalRevenue += lineTotal;
      });

      acc[eventId].totalSales += 1;

      return acc;
    },
    {} as { [eventId: string]: EventTierSummary }
  );

  const sortedEvents = Object.values(eventSummaries).sort((a, b) => {
    if (a.eventDate && b.eventDate) {
      return new Date(b.eventDate).getTime() - new Date(a.eventDate).getTime();
    }
    return b.totalRevenue - a.totalRevenue;
  });

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return 'TBA';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTotalQuantity = (ticketSale: TicketSale) => {
    return ticketSale.tickets.reduce(
      (total, ticket) => total + (ticket.quantity || 0),
      0
    );
  };

  const getEventTitle = (event: string | Event | null | undefined) => {
    if (!event) return 'N/A';
    if (typeof event === 'string') return 'Event ID: ' + event;
    return event.title || 'Unknown Event';
  };

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

  const exportEventToExcel = (event: EventTierSummary) => {
    // Prepare data for export
    const exportData = event.tickets.map((ticketSale) => {
      const totalQty = getTotalQuantity(ticketSale);

      return {
        'Ticket Number': ticketSale.ticketNumber,
        Date: formatDateTime(ticketSale.createdAt),
        'First Name': ticketSale.firstName,
        'Last Name': ticketSale.lastName,
        Email: ticketSale.customerEmail,
        Phone: ticketSale.customerPhone || '',
        Event: event.eventTitle,
        'Event Date': formatDate(event.eventDate),
        Location: event.eventLocation || '',
        Tier: ticketSale.ticketTier,
        Quantity: totalQty,
        'Subtotal (EUR)': ticketSale.ticketTotals.subtotal.toFixed(2),
        'VAT (EUR)': ticketSale.ticketTotals.vat.toFixed(2),
        'Total (EUR)': ticketSale.ticketTotals.total.toFixed(2),
        Status: ticketSale.status,
        'Payment Status': ticketSale.paymentStatus,
        'Payment Method': ticketSale.paymentMethod,
        'Transaction ID': ticketSale.transactionId || '',
        'Customer Notes': ticketSale.customerNotes || '',
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Ticket Number
      { wch: 18 }, // Date
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 25 }, // Email
      { wch: 15 }, // Phone
      { wch: 30 }, // Event
      { wch: 12 }, // Event Date
      { wch: 20 }, // Location
      { wch: 20 }, // Tier
      { wch: 10 }, // Quantity
      { wch: 12 }, // Subtotal
      { wch: 10 }, // VAT
      { wch: 12 }, // Total
      { wch: 12 }, // Status
      { wch: 15 }, // Payment Status
      { wch: 15 }, // Payment Method
      { wch: 20 }, // Transaction ID
      { wch: 30 }, // Customer Notes
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Ticket Sales');

    // Generate filename
    const eventName = event.eventTitle.replace(/[^a-z0-9]/gi, '_');
    const dateStr = new Date().toISOString().split('T')[0];
    const filename = `Ticket_Sales_${eventName}_${dateStr}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
  };

  // Calculate overall totals
  const overallTotals = sortedEvents.reduce(
    (acc, event) => {
      acc.totalQuantity += event.totalQuantity;
      acc.totalRevenue += event.totalRevenue;
      acc.totalSales += event.totalSales;
      return acc;
    },
    { totalQuantity: 0, totalRevenue: 0, totalSales: 0 }
  );

  return (
    <div className='bg-white rounded-lg border border-gray-200 p-6'>
      <div className='flex justify-between items-center mb-6'>
        <h2 className='text-lg font-semibold'>
          Ticket Sales Summary (By Event & Tier)
        </h2>
        {/* <div className='text-right'>
          <p className='text-sm text-gray-500'>Overall Totals</p>
          <p className='text-xs text-gray-400'>
            {overallTotals.totalQuantity} tickets • {overallTotals.totalSales}{' '}
            orders
          </p>
          <p className='text-lg font-bold text-blue-600'>
            {formatCurrency(overallTotals.totalRevenue, 'EUR')}
          </p>
        </div> */}
      </div>

      <div className='space-y-6'>
        {sortedEvents.length === 0 ? (
          <p className='text-gray-500 text-center py-4'>
            No paid ticket sales found
          </p>
        ) : (
          sortedEvents.map((event) => (
            <div
              key={event.eventId}
              className='border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow'
            >
              <div className='p-4 bg-white'>
                <div className='flex justify-between items-start mb-4 pb-3 border-b border-gray-100'>
                  <div className='flex-1'>
                    <h3 className='font-semibold text-base mb-1'>
                      {event.eventTitle}
                    </h3>
                    <div className='flex flex-wrap gap-2 text-xs text-gray-500'>
                      {event.eventDate && (
                        <span className='flex items-center gap-1'>
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z'
                            />
                          </svg>
                          {formatDate(event.eventDate)}
                        </span>
                      )}
                      {event.eventLocation && (
                        <span className='flex items-center gap-1'>
                          <svg
                            className='w-4 h-4'
                            fill='none'
                            stroke='currentColor'
                            viewBox='0 0 24 24'
                          >
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z'
                            />
                            <path
                              strokeLinecap='round'
                              strokeLinejoin='round'
                              strokeWidth={2}
                              d='M15 11a3 3 0 11-6 0 3 3 0 016 0z'
                            />
                          </svg>
                          {event.eventLocation}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className='text-right'>
                    <p className='text-sm font-medium text-gray-600'>
                      {event.totalQuantity} tickets
                    </p>
                    <p className='text-lg font-bold text-blue-600'>
                      {formatCurrency(event.totalRevenue, 'EUR')}
                    </p>
                    <p className='text-xs text-gray-400'>
                      {event.totalSales} orders
                    </p>
                  </div>
                </div>

                <div className='space-y-2'>
                  <p className='text-xs font-medium text-gray-500 uppercase tracking-wider mb-2'>
                    Ticket Tiers
                  </p>
                  {Object.entries(event.tiers)
                    .sort(([, a], [, b]) => b.quantity - a.quantity)
                    .map(([tierName, tierData]) => (
                      <div
                        key={tierName}
                        className='flex justify-between items-center py-2 px-3 bg-gray-50 rounded-md'
                      >
                        <div className='flex-1'>
                          <span className='text-sm font-medium'>
                            {tierName}
                          </span>
                          <span className='text-xs text-gray-500 ml-2'>
                            ({tierData.salesCount} orders)
                          </span>
                        </div>
                        <div className='flex items-center gap-4'>
                          <span className='text-sm text-gray-600'>
                            <span className='font-semibold'>
                              {tierData.quantity}
                            </span>{' '}
                            tickets
                          </span>
                          <span className='text-sm font-semibold text-gray-800 min-w-[80px] text-right'>
                            {formatCurrency(tierData.revenue, 'EUR')}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>

                <div className='flex gap-2 mt-4 pt-4 border-t border-gray-100'>
                  <button
                    onClick={() => toggleEventExpansion(event.eventId)}
                    className='flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d={
                          expandedEvents.has(event.eventId)
                            ? 'M5 15l7-7 7 7'
                            : 'M19 9l-7 7-7-7'
                        }
                      />
                    </svg>
                    {expandedEvents.has(event.eventId) ? 'Hide' : 'Show'} Ticket
                    Details ({event.tickets.length})
                  </button>
                  <button
                    onClick={() => exportEventToExcel(event)}
                    className='flex items-center justify-center gap-2 px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors'
                  >
                    <svg
                      className='w-5 h-5'
                      fill='none'
                      stroke='currentColor'
                      viewBox='0 0 24 24'
                    >
                      <path
                        strokeLinecap='round'
                        strokeLinejoin='round'
                        strokeWidth={2}
                        d='M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z'
                      />
                    </svg>
                    Export XLSX
                  </button>
                </div>
              </div>

              {expandedEvents.has(event.eventId) && (
                <div className='border-t border-gray-200 bg-gray-50'>
                  <div className='overflow-x-auto'>
                    <table className='min-w-full divide-y divide-gray-200'>
                      <thead className='bg-gray-100'>
                        <tr>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Ticket #
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Date
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Customer
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Tier
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Qty
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Total
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Status
                          </th>
                          <th className='px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider'>
                            Payment
                          </th>
                        </tr>
                      </thead>
                      <tbody className='bg-white divide-y divide-gray-200'>
                        {event.tickets.map((ticketSale) => (
                          <tr key={ticketSale.id} className='hover:bg-gray-50'>
                            <td className='px-4 py-3 whitespace-nowrap text-sm font-mono'>
                              {ticketSale.ticketNumber}
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap text-sm'>
                              {formatDateTime(ticketSale.createdAt)}
                            </td>
                            <td className='px-4 py-3 text-sm'>
                              <div>
                                <p className='font-medium'>
                                  {ticketSale.firstName} {ticketSale.lastName}
                                </p>
                                <p className='text-xs text-gray-500'>
                                  {ticketSale.customerEmail}
                                </p>
                              </div>
                            </td>
                            <td className='px-4 py-3 text-sm'>
                              {ticketSale.ticketTier || 'N/A'}
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap text-sm font-semibold'>
                              {getTotalQuantity(ticketSale)}
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap text-sm font-medium'>
                              {formatCurrency(
                                ticketSale.ticketTotals.total,
                                'EUR'
                              )}
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap text-sm'>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                                  ticketSale.status
                                )}`}
                              >
                                {ticketSale.status}
                              </span>
                            </td>
                            <td className='px-4 py-3 whitespace-nowrap text-sm'>
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
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
