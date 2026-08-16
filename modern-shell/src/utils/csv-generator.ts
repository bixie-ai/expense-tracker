import type { Expense } from '@/types/expense';

const CSV_HEADERS = ['Name', 'Amount', 'Date', 'Category', 'Type', 'Comments'] as const;

function escapeCsvField(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function formatDate(date: Date | string | null | undefined): string {
  if (!date) return '';

  if (typeof date === 'string') {
    const parsed = new Date(date);
    if (!isNaN(parsed.getTime())) {
      return formatDateValue(parsed);
    }
    return date;
  }

  return formatDateValue(date);
}

function formatDateValue(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const year = date.getFullYear();
  return `${month}-${day}-${year}`;
}

function formatAmount(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined) return '';
  return String(amount);
}

export function generateCsvString(data: Expense[]): string {
  if (!data || data.length === 0) return '';

  const headerRow = CSV_HEADERS.map(escapeCsvField).join(',');

  const dataRows = data.map((expense) => {
    const row = [
      escapeCsvField(expense.name ?? ''),
      escapeCsvField(formatAmount(expense.amount)),
      escapeCsvField(formatDate(expense.date)),
      escapeCsvField(expense.category ?? ''),
      escapeCsvField(expense.type ?? ''),
      escapeCsvField(expense.comments ?? ''),
    ];
    return row.join(',');
  });

  return [headerRow, ...dataRows].join('\r\n');
}
