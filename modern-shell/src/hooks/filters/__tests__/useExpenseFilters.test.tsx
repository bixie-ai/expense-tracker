import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpenseFilters } from '../useExpenseFilters';
import { TimeFrameValue, ExpenseEntryType } from '../../../types/filter-schema';
import { Expense } from '../../../types/expense';

const mockUserId = 'test-user-123';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mockUserId } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

const mockExpenses: Expense[] = [
  { id: '1', name: 'Coffee', date: '2024-03-15', category: 'Food', type: 'expense', amount: 5 },
  { id: '2', name: 'Salary', date: '2024-02-01', category: 'Income', type: 'income', amount: 5000 },
  {
    id: '3',
    name: 'Bank Import',
    date: '2024-03-10',
    category: 'Food',
    type: 'expense',
    amount: 42,
    importedFrom: 'bank-export.csv',
  },
  { id: '4', name: 'Old Expense', date: '2023-06-01', category: 'Transport', type: 'expense', amount: 30 },
];

describe('useExpenseFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with null values', () => {
    const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

    expect(result.current.filterParams.startDate).toBeNull();
    expect(result.current.filterParams.endDate).toBeNull();
    expect(result.current.filterParams.entryType).toBeNull();
    expect(result.current.isCustomRange).toBe(false);
  });

  it('should set date range when selecting a preset time frame', () => {
    const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

    act(() => {
      result.current.selectTimeFrame(TimeFrameValue.CURRENT_MONTH);
    });

    expect(result.current.filterParams.startDate).toBeInstanceOf(Date);
    expect(result.current.filterParams.endDate).toBeInstanceOf(Date);
    expect(result.current.isCustomRange).toBe(false);
  });

  it('should set isCustomRange to true when selecting custom', () => {
    const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

    act(() => {
      result.current.selectTimeFrame(TimeFrameValue.CUSTOM);
    });

    expect(result.current.isCustomRange).toBe(true);
  });

  it('should clear dates when deselecting time frame', () => {
    const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

    act(() => {
      result.current.selectTimeFrame(TimeFrameValue.CURRENT_MONTH);
    });

    expect(result.current.filterParams.startDate).not.toBeNull();

    act(() => {
      result.current.selectTimeFrame(null);
    });

    expect(result.current.filterParams.startDate).toBeNull();
    expect(result.current.filterParams.endDate).toBeNull();
  });

  it('should set entry type filter', () => {
    const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

    act(() => {
      result.current.selectEntryType(ExpenseEntryType.IMPORTED);
    });

    expect(result.current.filterParams.entryType).toBe('imported');
  });

  it('should clear entry type filter when set to null', () => {
    const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

    act(() => {
      result.current.selectEntryType(ExpenseEntryType.MANUAL);
    });

    act(() => {
      result.current.selectEntryType(null);
    });

    expect(result.current.filterParams.entryType).toBeNull();
  });

  it('should reset all filters', () => {
    const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

    act(() => {
      result.current.selectTimeFrame(TimeFrameValue.LAST_3_MONTHS);
      result.current.selectEntryType(ExpenseEntryType.IMPORTED);
    });

    act(() => {
      result.current.resetFilters();
    });

    expect(result.current.filterParams.startDate).toBeNull();
    expect(result.current.filterParams.endDate).toBeNull();
    expect(result.current.filterParams.entryType).toBeNull();
    expect(result.current.isCustomRange).toBe(false);
  });

  describe('filterExpenses', () => {
    it('should return all expenses when no filters are active', () => {
      const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

      const filtered = result.current.filterExpenses(mockExpenses);
      expect(filtered).toHaveLength(4);
    });

    it('should filter by date range', () => {
      const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

      act(() => {
        result.current.form.setValue('startDate', new Date('2024-03-01'));
        result.current.form.setValue('endDate', new Date('2024-03-31'));
      });

      const filtered = result.current.filterExpenses(mockExpenses);
      expect(filtered).toHaveLength(2);
      expect(filtered.map((e) => e.id)).toEqual(['1', '3']);
    });

    it('should filter by imported entry type', () => {
      const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

      act(() => {
        result.current.selectEntryType(ExpenseEntryType.IMPORTED);
      });

      const filtered = result.current.filterExpenses(mockExpenses);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('3');
    });

    it('should filter by manual entry type', () => {
      const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

      act(() => {
        result.current.selectEntryType(ExpenseEntryType.MANUAL);
      });

      const filtered = result.current.filterExpenses(mockExpenses);
      expect(filtered).toHaveLength(3);
      expect(filtered.every((e) => !e.importedFrom)).toBe(true);
    });

    it('should combine date and entry type filters', () => {
      const { result } = renderHook(() => useExpenseFilters(), { wrapper: createWrapper() });

      act(() => {
        result.current.form.setValue('startDate', new Date('2024-03-01'));
        result.current.form.setValue('endDate', new Date('2024-03-31'));
        result.current.selectEntryType(ExpenseEntryType.MANUAL);
      });

      const filtered = result.current.filterExpenses(mockExpenses);
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('1');
    });
  });
});
