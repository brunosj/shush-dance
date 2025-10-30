# Ticket Sales Dashboard Implementation

## Overview
This document describes the implementation of the Ticket Sales Dashboard feature, which provides comprehensive tracking and analytics for ticket sales per event and tier, with expandable ticket lists and Excel export functionality.

## What Was Implemented

### 1. Fixed TicketSales Collection (`src/payload/collections/TicketSales/index.ts`)
- **Added `totalQuantity` field**: Automatically calculated field that sums up all quantities from the `tickets` array
- **Added `total` field**: Automatically populated from `ticketTotals.total` for easier querying
- Both fields are read-only and calculated via `beforeChange` hooks
- Added to default columns for easier viewing in the admin panel
- **In Payload Admin**: The "Tickets" column now shows the real total quantity based on "Ticket Items"

### 2. Created API Endpoint (`src/app/_api/fetchTicketSales.ts`)
- New API function to fetch ticket sales data from the backend
- Includes authentication checks
- Returns validated ticket sales with proper type safety
- Fetches up to 1000 ticket sales with depth=2 for related data

### 3. Created TicketSalesDashboard Components

#### Main Dashboard (`src/app/_components/TicketSalesDashboard/index.tsx`)
- Main container component that orchestrates filtering and display
- Manages state for date ranges, statuses, payment statuses, and event filtering
- Removed the separate table view in favor of expandable event sections

#### Filters Component (`TicketSalesFilters.tsx`)
- **Date Range Filter**: Reuses the DateRangePicker from Music Sales
- **Ticket Status Filter**: Active, Used, Cancelled, Refunded
- **Payment Status Filter**: Pending, Paid, Failed, Refunded
- **Event Selector**: Dropdown to filter by specific event
- Automatically extracts unique events from ticket sales data

#### Summary Component (`TicketSalesSummary.tsx`)
- **Event-based aggregation**: Groups ticket sales by event
- **Tier breakdown**: Shows individual tier performance within each event
- **Key metrics per event**:
  - Total revenue
  - Total tickets sold
  - Number of orders
  - Event date and location
- **Tier metrics**:
  - Tickets sold per tier
  - Revenue per tier
  - Number of orders per tier
- **Overall totals**: Displays aggregate metrics across all events
- Only counts tickets with `paymentStatus: 'paid'`

##### New Features in Summary Component:

**Expandable Ticket Lists:**
- Each event card has a "Show Ticket Details" button
- Clicking the button expands/collapses a detailed table of all tickets for that event
- The button shows the count of tickets
- Table includes:
  - Ticket number
  - Date and time
  - Customer name and email
  - Ticket tier
  - Quantity
  - Total amount
  - Status (color-coded badges)
  - Payment status (color-coded badges)

**Excel Export Functionality:**
- Green "Export XLSX" button on each event card
- Generates a comprehensive Excel file with all ticket sales for that event
- Exported columns:
  - Ticket Number
  - Date (formatted)
  - First Name, Last Name
  - Email, Phone
  - Event name, date, location
  - Ticket Tier
  - Quantity
  - Subtotal, VAT, Total (all in EUR with 2 decimal places)
  - Status, Payment Status, Payment Method
  - Transaction ID
  - Customer Notes
- Auto-formatted column widths for readability
- Filename format: `Ticket_Sales_[EventName]_[Date].xlsx`
- Uses the `xlsx` library (SheetJS)

### 4. Updated Dashboard Page

#### Toggle Implementation (`src/app/(pages)/dashboard/page.client.tsx`)
- Added view mode toggle between "Music Sales" and "Ticket Sales"
- Beautiful UI with icons for each mode
- Separate data loading for each view
- Proper error handling and loading states
- Maintains state between view switches

#### Features:
- **Music Sales View**: Original music sales dashboard
- **Ticket Sales View**: New comprehensive ticket sales dashboard
- **Smart Loading**: Only loads data for the active view
- **Consistent UI**: Both views follow the same design language

## Usage

### Accessing the Dashboard
1. Navigate to `/dashboard` in your browser
2. Login to the CMS if not already authenticated
3. Use the toggle at the top right to switch between views

### Filtering Ticket Sales
- **By Date**: Use preset ranges (Q1-Q4, Year) or custom date ranges
- **By Status**: Click status buttons to filter (can select multiple)
- **By Payment Status**: Filter by payment completion status
- **By Event**: Select specific event from dropdown

### Understanding the Summary
- Each event card shows:
  - Event title, date, and location
  - Total revenue and ticket count
  - Breakdown by tier with individual metrics
- Overall totals displayed at the top right
- Only paid tickets are included in revenue calculations

### Viewing Ticket Details
1. Find the event you want to view
2. Click "Show Ticket Details" button
3. The detailed table expands below the event summary
4. Click again to collapse

### Exporting to Excel
1. Find the event you want to export
2. Click the green "Export XLSX" button
3. An Excel file will be downloaded automatically
4. The file includes all ticket sales for that event with complete details
5. Open with Excel, Google Sheets, or any spreadsheet application

## Technical Details

### Data Flow
1. User selects view mode (Music or Tickets)
2. `page.client.tsx` calls appropriate API endpoint
3. Data is fetched with authentication
4. Components render with filtered and sorted data
5. User interactions update local state (no re-fetching)

### Aggregation Logic
- Ticket sales are grouped by event ID
- Within each event, tickets are grouped by tier name
- Quantities are summed from the `tickets` array
- Revenue is calculated from `lineTotal` of each ticket item
- Only `paymentStatus: 'paid'` tickets are counted in revenue

### Excel Export Implementation
- Uses `xlsx` library (SheetJS) for Excel file generation
- Data is formatted before export:
  - Dates are converted to readable format
  - Numbers are formatted with 2 decimal places
  - Empty fields are replaced with empty strings
- Column widths are pre-configured for optimal viewing
- File generation happens client-side (no server required)
- Download is triggered automatically via `XLSX.writeFile()`

### Type Safety
- All components use proper TypeScript types
- TicketSale interface updated in `payload-types.ts`
- New fields (`totalQuantity`, `total`) added to type definitions

## Dependencies

### New Package Added
- **xlsx** (SheetJS): Excel file generation library
  - Installation: `pnpm add xlsx`
  - Used for: Exporting ticket sales data to .xlsx format
  - Documentation: https://docs.sheetjs.com/

## Files Created/Modified

### New Files
- `src/app/_api/fetchTicketSales.ts`
- `src/app/_components/TicketSalesDashboard/index.tsx`
- `src/app/_components/TicketSalesDashboard/TicketSalesFilters.tsx`
- `src/app/_components/TicketSalesDashboard/TicketSalesSummary.tsx`
- `src/app/_components/TicketSalesDashboard/TicketSalesTable.tsx` (kept for reference, not currently used)

### Modified Files
- `src/payload/collections/TicketSales/index.ts` - Added computed fields
- `src/payload/payload-types.ts` - Added new fields to TicketSale interface
- `src/app/(pages)/dashboard/page.tsx` - Simplified to use client component
- `src/app/(pages)/dashboard/page.client.tsx` - Complete rewrite with toggle
- `package.json` - Added xlsx dependency

## Future Enhancements

Potential improvements for the future:
1. Batch export (export all events at once)
2. PDF ticket generation
3. Email ticket details to customers directly from dashboard
4. QR code display in expanded view
5. Real-time updates via websockets
6. Revenue comparison charts
7. Customer analytics (repeat customers, etc.)
8. Refund processing from dashboard
9. Bulk operations (mark multiple as used, send batch emails, etc.)
10. Print view for ticket lists
11. Advanced filtering (by date range per event, by customer, etc.)
12. CSV export option alongside XLSX

## Notes

- The dashboard requires authentication to view data
- Ticket quantities are automatically calculated from the tickets array
- The system supports multiple tickets per order
- Date filtering is based on `createdAt` timestamp
- All monetary values are displayed in EUR
- Excel exports include all fields for complete record keeping
- The expandable view is useful for quick reference without overwhelming the UI
- Export files are named with event name and current date for easy organization

## Troubleshooting

### Excel Export Not Working
- Ensure the `xlsx` package is installed: `pnpm add xlsx`
- Check browser console for errors
- Verify pop-up blocker is not preventing download

### Ticket Quantities Not Showing in Payload
- The `totalQuantity` field is calculated via hook on save
- Existing records need to be re-saved to populate this field
- You can do this by editing and saving each record in the admin panel

### Empty Event Lists
- Check that ticket sales have `paymentStatus: 'paid'`
- Verify the event relationship is properly set
- Check date range filters are not too restrictive
