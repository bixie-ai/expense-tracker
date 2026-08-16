import { useState, useCallback } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
} from '@mui/material';
import { FileUploadZone } from '@/components/FileUploadZone/FileUploadZone';
import { FileImportReview } from '@/components/FileImportReview';
import { Expense } from '@/types/expense';
import { ReviewedExpenses } from '@/types/import';

const STEPS = ['Upload File', 'Map Columns', 'Review & Save'];

interface CsvParseResult {
  data: Expense[];
  error: string | null;
}

function parseCSV(text: string): CsvParseResult {
  const lines = text.split('\n').filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return { data: [], error: 'CSV file is empty or has no data rows.' };
  }

  const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
  const nameIdx = headers.findIndex((h) => h === 'name' || h === 'description');
  const dateIdx = headers.findIndex((h) => h === 'date');
  const amountIdx = headers.findIndex((h) => h === 'amount');
  const categoryIdx = headers.findIndex((h) => h === 'category');
  const typeIdx = headers.findIndex((h) => h === 'type');
  const commentsIdx = headers.findIndex((h) => h === 'comments' || h === 'notes');

  if (amountIdx === -1) {
    return { data: [], error: 'CSV must contain an "amount" column.' };
  }

  const expenses: Expense[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map((v) => v.trim());
    const amount = parseFloat(values[amountIdx] ?? '0');
    if (isNaN(amount)) continue;

    expenses.push({
      name: values[nameIdx] ?? '',
      date: values[dateIdx] ?? new Date().toISOString(),
      amount,
      category: values[categoryIdx] ?? 'Unassigned',
      type: values[typeIdx] ?? 'Debit',
      comments: values[commentsIdx] ?? '',
    });
  }

  return { data: expenses, error: null };
}

export function ImportExpenses() {
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [parsedExpenses, setParsedExpenses] = useState<Expense[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [reviewedExpenses, setReviewedExpenses] = useState<ReviewedExpenses>({
    debits: [],
    credits: [],
  });

  const handleFilesSelected = useCallback((selectedFiles: File[]) => {
    setFiles(selectedFiles);
    if (selectedFiles.length === 0) {
      setParsedExpenses([]);
      setParseError(null);
    }
  }, []);

  const handleNext = useCallback(() => {
    if (activeStep === 0 && files.length > 0) {
      setIsLoading(true);
      setParseError(null);

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const { data, error } = parseCSV(text);
        setIsLoading(false);
        if (error) {
          setParseError(error);
        } else {
          setParsedExpenses(data);
          setActiveStep(2);
        }
      };
      reader.onerror = () => {
        setIsLoading(false);
        setParseError('Error reading file.');
      };
      reader.readAsText(files[0]);
    } else if (activeStep < STEPS.length - 1) {
      setActiveStep((prev) => prev + 1);
    }
  }, [activeStep, files]);

  const handleBack = useCallback(() => {
    setActiveStep((prev) => Math.max(0, prev - 1));
  }, []);

  const handleReviewedExpensesChange = useCallback((reviewed: ReviewedExpenses) => {
    setReviewedExpenses(reviewed);
  }, []);

  const hasExpensesToSave =
    reviewedExpenses.debits.length > 0 || reviewedExpenses.credits.length > 0;

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Import Expenses
      </Typography>

      <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent>
            <FileUploadZone
              onFilesSelected={handleFilesSelected}
              acceptedTypes={['.csv']}
              multiple={false}
            />
            {parseError && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {parseError}
              </Alert>
            )}
            {isLoading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <CircularProgress size={24} />
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={files.length === 0 || isLoading}
              >
                Next
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card>
          <CardContent>
            <FileImportReview
              expenses={parsedExpenses}
              onReviewedExpensesChange={handleReviewedExpensesChange}
              isLoading={isLoading}
              error={parseError}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
              <Button onClick={handleBack}>Back</Button>
              <Button
                variant="contained"
                disabled={!hasExpensesToSave}
              >
                Save Expenses
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
