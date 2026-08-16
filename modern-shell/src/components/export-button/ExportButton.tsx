import { Button, CircularProgress } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { useCsvExport } from '@/hooks/use-csv-export';
import type { Expense } from '@/types/expense';

export interface ExportButtonProps {
  data: Expense[];
  fileName?: string;
  disabled?: boolean;
}

export function ExportButton({ data, fileName, disabled }: ExportButtonProps) {
  const { exportCsv, isExporting, error } = useCsvExport({ fileName });

  const handleClick = () => {
    exportCsv(data);
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={isExporting ? <CircularProgress size={16} /> : <FileDownloadIcon />}
        onClick={handleClick}
        disabled={disabled || isExporting || !data || data.length === 0}
      >
        {isExporting ? 'Exporting...' : 'Export CSV'}
      </Button>
      {error && (
        <span role="alert" style={{ color: 'red', fontSize: '0.75rem', marginLeft: 8 }}>
          {error}
        </span>
      )}
    </>
  );
}
