import { useState, useCallback } from 'react';
import { Box, Tab, Tabs, Typography, CircularProgress, Alert } from '@mui/material';
import { Expense } from '@/types/expense';
import { ReviewedExpenses } from '@/types/import';
import { useImportReview } from '@/hooks/import';
import { ImportReviewTable } from './ImportReviewTable';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  if (value !== index) return null;
  return (
    <Box role="tabpanel" sx={{ pt: 2 }}>
      {children}
    </Box>
  );
}

export interface FileImportReviewProps {
  expenses: Expense[];
  onReviewedExpensesChange?: (reviewed: ReviewedExpenses) => void;
  isLoading?: boolean;
  error?: string | null;
  categories?: string[];
  paymentTypes?: string[];
}

export function FileImportReview({
  expenses,
  onReviewedExpensesChange,
  isLoading = false,
  error = null,
  categories,
  paymentTypes,
}: FileImportReviewProps) {
  const [tabValue, setTabValue] = useState(0);
  const {
    reviewedExpenses,
    updateReviewedExpenses,
  } = useImportReview();

  const handleDebitChange = useCallback(
    (updated: Expense[]) => {
      updateReviewedExpenses('debits', updated);
      const newReviewed = { ...reviewedExpenses, debits: updated };
      onReviewedExpensesChange?.(newReviewed);
    },
    [updateReviewedExpenses, reviewedExpenses, onReviewedExpensesChange]
  );

  const handleCreditChange = useCallback(
    (updated: Expense[]) => {
      updateReviewedExpenses('credits', updated);
      const newReviewed = { ...reviewedExpenses, credits: updated };
      onReviewedExpensesChange?.(newReviewed);
    },
    [updateReviewedExpenses, reviewedExpenses, onReviewedExpensesChange]
  );

  // Split expenses by debit/credit based on amount sign
  const debits = expenses.filter((_, i) => {
    const expense = expenses[i];
    return (expense.amount as number) >= 0;
  }).map((e, i) => ({ ...e, id: e.id ?? `${i + 1}-debit` }));

  const credits = expenses.filter((_, i) => {
    const expense = expenses[i];
    return (expense.amount as number) < 0;
  }).map((e, i) => ({ ...e, id: e.id ?? `${i + 1}-credit` }));

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress aria-label="Loading expenses" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  if (expenses.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 4 }}>
        <Typography variant="body1" color="text.secondary">
          No expense data to review. Please upload and map a CSV file first.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Tabs
        value={tabValue}
        onChange={(_, newValue) => setTabValue(newValue)}
        aria-label="Expense review tabs"
      >
        <Tab label="Expenses" id="review-tab-0" aria-controls="review-tabpanel-0" />
        <Tab label="Credits" id="review-tab-1" aria-controls="review-tabpanel-1" />
      </Tabs>

      <TabPanel value={tabValue} index={0}>
        {debits.length > 0 ? (
          <ImportReviewTable
            expenses={debits}
            onExpensesChange={handleDebitChange}
            categories={categories}
            paymentTypes={paymentTypes}
          />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="text.secondary">
              No expenses to display.
            </Typography>
          </Box>
        )}
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {credits.length > 0 ? (
          <ImportReviewTable
            expenses={credits}
            onExpensesChange={handleCreditChange}
            categories={categories}
            paymentTypes={paymentTypes}
          />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No credits to display.
            </Typography>
          </Box>
        )}
      </TabPanel>
    </Box>
  );
}
