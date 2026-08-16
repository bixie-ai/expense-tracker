import { useState, useMemo, useCallback } from 'react';
import { Expense } from '@/types/expense';
import { ReviewedExpenses } from '@/types/import';

export interface UseImportReviewResult {
  debitExpenses: Expense[];
  creditExpenses: Expense[];
  reviewedExpenses: ReviewedExpenses;
  updateReviewedExpenses: (source: 'debits' | 'credits', expenses: Expense[]) => void;
  setExpenses: (expenses: Expense[]) => void;
  hasReviewedExpenses: boolean;
}

export function useImportReview(): UseImportReviewResult {
  const [expenses, setExpensesState] = useState<Expense[]>([]);
  const [reviewedExpenses, setReviewedExpenses] = useState<ReviewedExpenses>({
    debits: [],
    credits: [],
  });

  const { debitExpenses, creditExpenses } = useMemo(() => {
    const debits: Expense[] = [];
    const credits: Expense[] = [];
    expenses.forEach((expense, index) => {
      if ((expense.amount as number) < 0) {
        credits.push({ ...expense, id: `${index + 1}-credit` });
      } else {
        debits.push({ ...expense, id: `${index + 1}-debit` });
      }
    });
    return { debitExpenses: debits, creditExpenses: credits };
  }, [expenses]);

  const updateReviewedExpenses = useCallback(
    (source: 'debits' | 'credits', updated: Expense[]) => {
      setReviewedExpenses((prev) => ({ ...prev, [source]: updated }));
    },
    []
  );

  const setExpenses = useCallback((newExpenses: Expense[]) => {
    setExpensesState(newExpenses);
    const debits: Expense[] = [];
    const credits: Expense[] = [];
    newExpenses.forEach((expense, index) => {
      if ((expense.amount as number) < 0) {
        credits.push({ ...expense, id: `${index + 1}-credit` });
      } else {
        debits.push({ ...expense, id: `${index + 1}-debit` });
      }
    });
    setReviewedExpenses({ debits, credits });
  }, []);

  const hasReviewedExpenses =
    reviewedExpenses.debits.length > 0 || reviewedExpenses.credits.length > 0;

  return {
    debitExpenses,
    creditExpenses,
    reviewedExpenses,
    updateReviewedExpenses,
    setExpenses,
    hasReviewedExpenses,
  };
}
