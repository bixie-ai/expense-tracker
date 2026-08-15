import { useQuery } from '@tanstack/react-query';
import { startOfDay, endOfDay, isWithinInterval } from 'date-fns';
import { fetchExpenses } from '@/api/expenses';
import {
  type Expense,
  type ExpenseFilters,
  type TimeFrameFilter,
  EntryType,
} from '@/schemas/expense.schema';

export const expenseKeys = {
  all: ['expenses'] as const,
  list: (userId: string) => [...expenseKeys.all, userId] as const,
  filtered: (userId: string, filters: ExpenseFilters) =>
    [...expenseKeys.list(userId), filters] as const,
};

function parseExpenseDate(expense: Expense): Date {
  return expense.date instanceof Date ? expense.date : new Date(expense.date);
}

function filterByDateInterval(
  expenses: Expense[],
  start: Date,
  end: Date
): Expense[] {
  const interval = {
    start: startOfDay(start),
    end: endOfDay(end),
  };

  return expenses.filter((expense) => {
    const expenseDate = parseExpenseDate(expense);
    return isWithinInterval(expenseDate, interval);
  });
}

function filterByEntryType(
  expenses: Expense[],
  entryType: string | undefined
): Expense[] {
  if (!entryType) {
    return expenses;
  }

  if (entryType === EntryType.MANUAL) {
    return expenses.filter((expense) => !expense.importedOn);
  }

  return expenses.filter((expense) => !!expense.importedOn);
}

function filterByCustomDateRange(
  expenses: Expense[],
  timeFilter: TimeFrameFilter
): Expense[] {
  const { customDateRange } = timeFilter;
  const start = customDateRange?.start;
  const end = customDateRange?.end;

  if (!start || !end) {
    return expenses;
  }

  return filterByDateInterval(expenses, start, end);
}

function filterByTimeFrame(
  expenses: Expense[],
  timeFilter: TimeFrameFilter
): Expense[] {
  const { start, end } = timeFilter.getDates();

  if (!start || !end) {
    return expenses;
  }

  return filterByDateInterval(expenses, start, end);
}

function applyFilters(expenses: Expense[], filters: ExpenseFilters): Expense[] {
  const { timeFrame, entryType } = filters;

  let result = filterByEntryType(expenses, entryType);

  if (!timeFrame || result.length === 0) {
    return result;
  }

  if (timeFrame.customDateRange) {
    return filterByCustomDateRange(result, timeFrame);
  }

  return filterByTimeFrame(result, timeFrame);
}

export function useExpenses(userId: string | undefined, filters: ExpenseFilters = {}) {
  return useQuery({
    queryKey: expenseKeys.filtered(userId ?? '', filters),
    queryFn: () => fetchExpenses(userId!),
    enabled: !!userId,
    select: (data) => applyFilters(data, filters),
  });
}

export {
  applyFilters,
  filterByEntryType,
  filterByTimeFrame,
  filterByCustomDateRange,
  filterByDateInterval,
  parseExpenseDate,
};
