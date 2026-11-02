import * as XLSX from 'xlsx';

export function downloadXlsx(
  filename: string,
  sheetName: string,
  rows: Record<string, string | number>[],
  colWidths?: { wch: number }[]
): void {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  if (colWidths?.length) {
    ws['!cols'] = colWidths;
  }
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, filename);
}
