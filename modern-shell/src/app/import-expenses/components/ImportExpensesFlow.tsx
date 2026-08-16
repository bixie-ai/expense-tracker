import { useState, useCallback } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { FileUploadZone } from '@/components/FileUploadZone/FileUploadZone';
import type { Expense } from '@/types/expense';
import { parseCsvText } from '../hooks/useCsvMapper';
import type { CsvRow } from '../utils/csv-validation';
import { FileImportMapper } from './file-import-mapper/FileImportMapper';

type FlowStep = 'upload' | 'map' | 'preview';

export function ImportExpensesFlow() {
  const [step, setStep] = useState<FlowStep>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [previewExpenses, setPreviewExpenses] = useState<Expense[]>([]);
  const [isMapperValid, setIsMapperValid] = useState(false);

  const handleFilesSelected = useCallback((files: File[]) => {
    if (files.length === 0) {
      setFile(null);
      setStep('upload');
      return;
    }

    const selectedFile = files[0];
    setFile(selectedFile);

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCsvText(text);
      setCsvHeaders(headers);
      setCsvData(rows);
      setStep('map');
    };
    reader.readAsText(selectedFile);
  }, []);

  const handlePreviewData = useCallback((expenses: Expense[]) => {
    setPreviewExpenses(expenses);
  }, []);

  const handleValidityChange = useCallback((valid: boolean) => {
    setIsMapperValid(valid);
  }, []);

  const handleProceedToPreview = useCallback(() => {
    setStep('preview');
  }, []);

  const handleBack = useCallback(() => {
    if (step === 'map') {
      setStep('upload');
      setFile(null);
      setCsvHeaders([]);
      setCsvData([]);
    } else if (step === 'preview') {
      setStep('map');
    }
  }, [step]);

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h5" gutterBottom>
        Import Expenses
      </Typography>

      {step === 'upload' && (
        <FileUploadZone onFilesSelected={handleFilesSelected} acceptedTypes={['.csv']} multiple={false} />
      )}

      {step === 'map' && file && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Map CSV columns to expense fields
          </Typography>
          <FileImportMapper
            file={file}
            csvData={csvData}
            csvHeaders={csvHeaders}
            onPreviewData={handlePreviewData}
            onValidityChange={handleValidityChange}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
            <Button variant="outlined" onClick={handleBack}>
              Back
            </Button>
            <Button variant="contained" disabled={!isMapperValid} onClick={handleProceedToPreview}>
              Preview ({previewExpenses.length} expenses)
            </Button>
          </Box>
        </Box>
      )}

      {step === 'preview' && (
        <Box>
          <Typography variant="subtitle1" gutterBottom>
            Preview: {previewExpenses.length} expenses ready to import
          </Typography>
          <Button variant="outlined" onClick={handleBack} sx={{ mt: 2 }}>
            Back to Mapping
          </Button>
        </Box>
      )}
    </Box>
  );
}
