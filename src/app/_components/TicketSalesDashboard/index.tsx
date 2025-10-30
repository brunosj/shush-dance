'use client';

import { useState, useMemo } from 'react';
import { TicketSalesFilters } from './TicketSalesFilters';
import { TicketSalesSummary } from './TicketSalesSummary';
import type { TicketSale } from '../../../payload/payload-types';

interface TicketSalesDashboardProps {
  initialTicketSales: TicketSale[];
}

export function TicketSalesDashboard({
  initialTicketSales,
}: TicketSalesDashboardProps) {
  const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([
    null,
    null,
  ]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [selectedPaymentStatuses, setSelectedPaymentStatuses] = useState<string[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const filteredTicketSales = useMemo(() => {
    return initialTicketSales.filter((ticketSale) => {
      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(ticketSale.status);
      const matchesPaymentStatus =
        selectedPaymentStatuses.length === 0 ||
        selectedPaymentStatuses.includes(ticketSale.paymentStatus);
      const matchesDate =
        !dateRange[0] ||
        !dateRange[1] ||
        (new Date(ticketSale.createdAt) >= dateRange[0] &&
          new Date(ticketSale.createdAt) <= dateRange[1]);
      
      // Handle event filtering (event can be string ID or Event object)
      let matchesEvent = !selectedEvent;
      if (selectedEvent && ticketSale.event) {
        if (typeof ticketSale.event === 'string') {
          matchesEvent = ticketSale.event === selectedEvent;
        } else if (typeof ticketSale.event === 'object' && ticketSale.event !== null) {
          matchesEvent = ticketSale.event.id === selectedEvent;
        }
      }

      return matchesStatus && matchesPaymentStatus && matchesDate && matchesEvent;
    });
  }, [
    initialTicketSales,
    selectedStatuses,
    selectedPaymentStatuses,
    dateRange,
    selectedEvent,
  ]);

  return (
    <div className='space-y-8'>
      <TicketSalesFilters
        dateRange={dateRange}
        setDateRange={setDateRange}
        selectedStatuses={selectedStatuses}
        setSelectedStatuses={setSelectedStatuses}
        selectedPaymentStatuses={selectedPaymentStatuses}
        setSelectedPaymentStatuses={setSelectedPaymentStatuses}
        selectedEvent={selectedEvent}
        setSelectedEvent={setSelectedEvent}
        allTicketSales={initialTicketSales}
      />

      <TicketSalesSummary ticketSales={filteredTicketSales} />
    </div>
  );
}
