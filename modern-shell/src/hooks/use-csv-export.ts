import { useState, useCallback } from 'react';
import { generateCsvString } from '@/utils/csv-generator';
import type { Expense } from '@/types/expense';

export interface UseCsvExportOptions {
  fileName?: string;
}

export interface UseCsvExportReturn {
  exportCsv: (data: Expense[]) => void;
  isExporting: boolean;
  error: string | null;
}

function getFormattedTimestamp(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const year = now.getFullYear();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  return `${month}-${day}-${year} ${hours}-${minutes}-${seconds}`;
}

export function useCsvExport(options: UseCsvExportOptions = {}): UseCsvExportReturn {
  const { fileName = 'expenses-export' } = options;
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const exportCsv = useCallback(
    (data: Expense[]) => {
      setError(null);
      setIsExporting(true);

      try {
        const csv = generateCsvString(data);

        if (!csv) {
          setError('No data to export');
          setIsExporting(false);
          return;
        }

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `${fileName}-${getFormattedTimestamp()}.csv`;
        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        setIsExporting(false);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Export failed');
        setIsExporting(false);
      }
    },
    [fileName]
  );

  return { exportCsv, isExporting, error };
}
