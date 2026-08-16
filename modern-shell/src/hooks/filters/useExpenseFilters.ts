import { useCallback, useMemo } from 'react';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import {
  ExpenseFilterFormValues,
  getDateRangeForTimeFrame,
  TimeFrameValue,
  ExpenseEntryType,
} from '../../types/filter-schema';
import { expenseKeys } from '../expenses/queryKeys';
import { useAuth } from '../../contexts/AuthContext';
import { Expense } from '../../types/expense';

export interface ExpenseFilterParams {
  startDate: Date | null;
  endDate: Date | null;
  entryType: ExpenseEntryType | null;
}

export interface UseExpenseFiltersReturn {
  form: UseFormReturn<ExpenseFilterFormValues>;
  filterParams: ExpenseFilterParams;
  isCustomRange: boolean;
  selectTimeFrame: (value: TimeFrameValue | null) => void;
  selectEntryType: (value: ExpenseEntryType | null) => void;
  filterExpenses: (expenses: Expense[]) => Expense[];
  resetFilters: () => void;
}

const DEFAULT_VALUES: ExpenseFilterFormValues = {
  timeFrame: null,
  entryType: null,
  startDate: null,
  endDate: null,
};

export function useExpenseFilters(): UseExpenseFiltersReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const form = useForm<ExpenseFilterFormValues>({
    defaultValues: DEFAULT_VALUES,
  });

  const timeFrame = form.watch('timeFrame');
  const startDate = form.watch('startDate');
  const endDate = form.watch('endDate');
  const entryType = form.watch('entryType');

  const isCustomRange = timeFrame === TimeFrameValue.CUSTOM;

  const filterParams: ExpenseFilterParams = useMemo(
    () => ({ startDate, endDate, entryType }),
    [startDate, endDate, entryType],
  );

  const invalidateExpenses = useCallback(() => {
    if (user?.uid) {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(user.uid) });
    }
  }, [queryClient, user?.uid]);

  const selectTimeFrame = useCallback(
    (value: TimeFrameValue | null) => {
      if (value === null) {
        form.setValue('timeFrame', null);
        form.setValue('startDate', null);
        form.setValue('endDate', null);
      } else {
        form.setValue('timeFrame', value);
        const range = getDateRangeForTimeFrame(value);
        if (range) {
          form.setValue('startDate', range.start);
          form.setValue('endDate', range.end);
        }
      }
      invalidateExpenses();
    },
    [form, invalidateExpenses],
  );

  const selectEntryType = useCallback(
    (value: ExpenseEntryType | null) => {
      form.setValue('entryType', value);
      invalidateExpenses();
    },
    [form, invalidateExpenses],
  );

  const filterExpenses = useCallback(
    (expenses: Expense[]): Expense[] => {
      let filtered = expenses;

      if (startDate && endDate) {
        filtered = filtered.filter((expense) => {
          const expenseDate = new Date(expense.date);
          return expenseDate >= startDate && expenseDate <= endDate;
        });
      }

      if (entryType) {
        filtered = filtered.filter((expense) => {
          if (entryType === ExpenseEntryType.IMPORTED) {
            return !!expense.importedFrom;
          }
          return !expense.importedFrom;
        });
      }

      return filtered;
    },
    [startDate, endDate, entryType],
  );

  const resetFilters = useCallback(() => {
    form.reset(DEFAULT_VALUES);
    invalidateExpenses();
  }, [form, invalidateExpenses]);

  return {
    form,
    filterParams,
    isCustomRange,
    selectTimeFrame,
    selectEntryType,
    filterExpenses,
    resetFilters,
  };
}
