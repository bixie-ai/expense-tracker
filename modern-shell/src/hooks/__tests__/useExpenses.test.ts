import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ReactNode } from 'react';
import {
  useExpenses,
  expenseKeys,
  applyFilters,
  filterByEntryType,
  filterByTimeFrame,
  filterByCustomDateRange,
  filterByDateInterval,
  parseExpenseDate,
} from '../useExpenses';
import { type Expense, type ExpenseFilters, type TimeFrameFilter, EntryType } from '@/schemas/expense.schema';
import * as expensesApi from '@/api/expenses';

vi.mock('@/api/expenses', () => ({
  fetchExpenses: vi.fn(),
}));

const mockExpenses: Expense[] = [
  { id: '1', name: 'Groceries', date: '2024-03-15', category: 'Food', type: 'Debit', amount: 50 },
  { id: '2', name: 'Gas', date: '2024-03-20', category: 'Transportation', type: 'Credit', amount: 40, importedOn: new Date('2024-03-21') },
  { id: '3', name: 'Netflix', date: '2024-04-01', category: 'Entertainment', type: 'Debit', amount: 15 },
  { id: '4', name: 'Lunch', date: '2024-04-10', category: 'Dining out', type: 'Cash', amount: 25, importedOn: new Date('2024-04-11'), importedFrom: 'bank-csv' },
  { id: '5', name: 'Books', date: '2024-02-28', category: 'Entertainment', type: 'Debit', amount: 30 },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children);
  };
}

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('hook behavior', () => {
    it('should return loading state initially', () => {
      vi.mocked(expensesApi.fetchExpenses).mockReturnValue(new Promise(() => {}));
      const { result } = renderHook(() => useExpenses('user-1'), { wrapper: createWrapper() });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.data).toBeUndefined();
    });

    it('should return data after successful fetch', async () => {
      vi.mocked(expensesApi.fetchExpenses).mockResolvedValue(mockExpenses);
      const { result } = renderHook(() => useExpenses('user-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toEqual(mockExpenses);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should return error state on fetch failure', async () => {
      const error = new Error('Network error');
      vi.mocked(expensesApi.fetchExpenses).mockRejectedValue(error);
      const { result } = renderHook(() => useExpenses('user-1'), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isError).toBe(true));

      expect(result.current.error).toBe(error);
      expect(result.current.data).toBeUndefined();
    });

    it('should not fetch when userId is undefined', () => {
      const { result } = renderHook(() => useExpenses(undefined), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe('idle');
      expect(expensesApi.fetchExpenses).not.toHaveBeenCalled();
    });

    it('should not fetch when userId is empty string', () => {
      const { result } = renderHook(() => useExpenses(''), { wrapper: createWrapper() });

      expect(result.current.fetchStatus).toBe('idle');
      expect(expensesApi.fetchExpenses).not.toHaveBeenCalled();
    });

    it('should call fetchExpenses with the userId', async () => {
      vi.mocked(expensesApi.fetchExpenses).mockResolvedValue([]);
      renderHook(() => useExpenses('user-123'), { wrapper: createWrapper() });

      await waitFor(() => expect(expensesApi.fetchExpenses).toHaveBeenCalledWith('user-123'));
    });
  });

  describe('query key structure', () => {
    it('should use structured query key with filters', async () => {
      vi.mocked(expensesApi.fetchExpenses).mockResolvedValue(mockExpenses);
      const filters: ExpenseFilters = { entryType: EntryType.MANUAL };

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);

      renderHook(() => useExpenses('user-1', filters), { wrapper });

      await waitFor(() => {
        const cache = queryClient.getQueryCache().findAll();
        expect(cache.length).toBe(1);
        expect(cache[0].queryKey).toEqual(['expenses', 'user-1', { entryType: 'manual' }]);
      });
    });

    it('should refetch when filters change', async () => {
      vi.mocked(expensesApi.fetchExpenses).mockResolvedValue(mockExpenses);

      const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
      const wrapper = ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: queryClient }, children);

      const { result, rerender } = renderHook(
        ({ filters }) => useExpenses('user-1', filters),
        { wrapper, initialProps: { filters: {} as ExpenseFilters } }
      );

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      rerender({ filters: { entryType: EntryType.MANUAL } });

      await waitFor(() => {
        const cache = queryClient.getQueryCache().findAll();
        expect(cache.length).toBe(2);
      });
    });
  });

  describe('select filtering', () => {
    it('should apply entryType filter through select', async () => {
      vi.mocked(expensesApi.fetchExpenses).mockResolvedValue(mockExpenses);
      const filters: ExpenseFilters = { entryType: EntryType.MANUAL };

      const { result } = renderHook(() => useExpenses('user-1', filters), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(3);
      expect(result.current.data!.every((e) => !e.importedOn)).toBe(true);
    });

    it('should apply timeFrame filter through select', async () => {
      vi.mocked(expensesApi.fetchExpenses).mockResolvedValue(mockExpenses);
      const timeFrame: TimeFrameFilter = {
        label: 'March 2024',
        value: 'march-2024',
        getDates: () => ({ start: new Date('2024-03-01'), end: new Date('2024-03-31') }),
      };
      const filters: ExpenseFilters = { timeFrame };

      const { result } = renderHook(() => useExpenses('user-1', filters), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(2);
      expect(result.current.data!.map((e) => e.id)).toEqual(['1', '2']);
    });

    it('should apply combined entryType and timeFrame filters', async () => {
      vi.mocked(expensesApi.fetchExpenses).mockResolvedValue(mockExpenses);
      const timeFrame: TimeFrameFilter = {
        label: 'March 2024',
        value: 'march-2024',
        getDates: () => ({ start: new Date('2024-03-01'), end: new Date('2024-03-31') }),
      };
      const filters: ExpenseFilters = { timeFrame, entryType: EntryType.MANUAL };

      const { result } = renderHook(() => useExpenses('user-1', filters), { wrapper: createWrapper() });

      await waitFor(() => expect(result.current.isSuccess).toBe(true));

      expect(result.current.data).toHaveLength(1);
      expect(result.current.data![0].id).toBe('1');
    });
  });
});

describe('expenseKeys', () => {
  it('should produce correct "all" key', () => {
    expect(expenseKeys.all).toEqual(['expenses']);
  });

  it('should produce correct "list" key with userId', () => {
    expect(expenseKeys.list('user-42')).toEqual(['expenses', 'user-42']);
  });

  it('should produce correct "filtered" key with userId and filters', () => {
    const filters: ExpenseFilters = { entryType: EntryType.IMPORTED };
    expect(expenseKeys.filtered('user-42', filters)).toEqual(['expenses', 'user-42', { entryType: 'imported' }]);
  });
});

describe('parseExpenseDate', () => {
  it('should return Date as-is when date is already a Date', () => {
    const date = new Date('2024-03-15');
    const expense: Expense = { name: 'Test', date, category: 'Food', type: 'Debit', amount: 10 };
    expect(parseExpenseDate(expense)).toBe(date);
  });

  it('should parse string date into Date object', () => {
    const expense: Expense = { name: 'Test', date: '2024-03-15', category: 'Food', type: 'Debit', amount: 10 };
    const result = parseExpenseDate(expense);
    expect(result).toBeInstanceOf(Date);
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(2);
    expect(result.getDate()).toBe(15);
  });
});

describe('filterByDateInterval', () => {
  it('should include expenses within the interval', () => {
    const start = new Date('2024-03-01');
    const end = new Date('2024-03-31');
    const result = filterByDateInterval(mockExpenses, start, end);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['1', '2']);
  });

  it('should include expenses on the boundary dates', () => {
    const start = new Date('2024-03-15');
    const end = new Date('2024-03-15');
    const result = filterByDateInterval(mockExpenses, start, end);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });

  it('should return empty array when no expenses match', () => {
    const start = new Date('2025-01-01');
    const end = new Date('2025-01-31');
    const result = filterByDateInterval(mockExpenses, start, end);
    expect(result).toHaveLength(0);
  });

  it('should handle empty expenses array', () => {
    const start = new Date('2024-03-01');
    const end = new Date('2024-03-31');
    const result = filterByDateInterval([], start, end);
    expect(result).toHaveLength(0);
  });
});

describe('filterByEntryType', () => {
  it('should return all expenses when entryType is undefined', () => {
    const result = filterByEntryType(mockExpenses, undefined);
    expect(result).toEqual(mockExpenses);
  });

  it('should return only manual expenses when entryType is MANUAL', () => {
    const result = filterByEntryType(mockExpenses, EntryType.MANUAL);
    expect(result).toHaveLength(3);
    expect(result.every((e) => !e.importedOn)).toBe(true);
  });

  it('should return only imported expenses when entryType is IMPORTED', () => {
    const result = filterByEntryType(mockExpenses, EntryType.IMPORTED);
    expect(result).toHaveLength(2);
    expect(result.every((e) => !!e.importedOn)).toBe(true);
  });

  it('should handle empty array', () => {
    const result = filterByEntryType([], EntryType.MANUAL);
    expect(result).toHaveLength(0);
  });
});

describe('filterByTimeFrame', () => {
  it('should filter expenses within timeFrame getDates range', () => {
    const timeFilter: TimeFrameFilter = {
      label: 'April 2024',
      value: 'april-2024',
      getDates: () => ({ start: new Date('2024-04-01'), end: new Date('2024-04-30') }),
    };
    const result = filterByTimeFrame(mockExpenses, timeFilter);
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['3', '4']);
  });

  it('should return all expenses when getDates returns null start', () => {
    const timeFilter: TimeFrameFilter = {
      label: 'All time',
      value: 'all',
      getDates: () => ({ start: null, end: new Date('2024-12-31') }),
    };
    const result = filterByTimeFrame(mockExpenses, timeFilter);
    expect(result).toEqual(mockExpenses);
  });

  it('should return all expenses when getDates returns null end', () => {
    const timeFilter: TimeFrameFilter = {
      label: 'All time',
      value: 'all',
      getDates: () => ({ start: new Date('2024-01-01'), end: null }),
    };
    const result = filterByTimeFrame(mockExpenses, timeFilter);
    expect(result).toEqual(mockExpenses);
  });

  it('should return all expenses when getDates returns both null', () => {
    const timeFilter: TimeFrameFilter = {
      label: 'All time',
      value: 'all',
      getDates: () => ({ start: null, end: null }),
    };
    const result = filterByTimeFrame(mockExpenses, timeFilter);
    expect(result).toEqual(mockExpenses);
  });
});

describe('filterByCustomDateRange', () => {
  it('should filter expenses within custom date range', () => {
    const timeFilter: TimeFrameFilter = {
      label: 'Custom',
      value: 'custom',
      getDates: () => ({ start: null, end: null }),
      customDateRange: { start: new Date('2024-03-10'), end: new Date('2024-04-05') },
    };
    const result = filterByCustomDateRange(mockExpenses, timeFilter);
    expect(result).toHaveLength(3);
    expect(result.map((e) => e.id)).toEqual(['1', '2', '3']);
  });

  it('should return all expenses when customDateRange is undefined', () => {
    const timeFilter: TimeFrameFilter = {
      label: 'Custom',
      value: 'custom',
      getDates: () => ({ start: null, end: null }),
    };
    const result = filterByCustomDateRange(mockExpenses, timeFilter);
    expect(result).toEqual(mockExpenses);
  });
});

describe('applyFilters', () => {
  it('should return all expenses when no filters provided', () => {
    const result = applyFilters(mockExpenses, {});
    expect(result).toEqual(mockExpenses);
  });

  it('should apply only entryType when no timeFrame', () => {
    const result = applyFilters(mockExpenses, { entryType: EntryType.IMPORTED });
    expect(result).toHaveLength(2);
    expect(result.every((e) => !!e.importedOn)).toBe(true);
  });

  it('should apply timeFrame with getDates when no customDateRange', () => {
    const timeFrame: TimeFrameFilter = {
      label: 'March',
      value: 'march',
      getDates: () => ({ start: new Date('2024-03-01'), end: new Date('2024-03-31') }),
    };
    const result = applyFilters(mockExpenses, { timeFrame });
    expect(result).toHaveLength(2);
  });

  it('should prefer customDateRange over getDates', () => {
    const timeFrame: TimeFrameFilter = {
      label: 'Custom',
      value: 'custom',
      getDates: () => ({ start: new Date('2024-01-01'), end: new Date('2024-01-31') }),
      customDateRange: { start: new Date('2024-03-01'), end: new Date('2024-03-31') },
    };
    const result = applyFilters(mockExpenses, { timeFrame });
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(['1', '2']);
  });

  it('should return empty array when entryType filter removes all expenses before timeFrame', () => {
    const timeFrame: TimeFrameFilter = {
      label: 'February',
      value: 'feb',
      getDates: () => ({ start: new Date('2024-02-01'), end: new Date('2024-02-29') }),
    };
    const result = applyFilters(mockExpenses, { timeFrame, entryType: EntryType.IMPORTED });
    expect(result).toHaveLength(0);
  });

  it('should apply both filters in combination', () => {
    const timeFrame: TimeFrameFilter = {
      label: 'April',
      value: 'april',
      getDates: () => ({ start: new Date('2024-04-01'), end: new Date('2024-04-30') }),
    };
    const result = applyFilters(mockExpenses, { timeFrame, entryType: EntryType.IMPORTED });
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('4');
  });

  it('should skip timeFrame filtering when entryType filter yields empty array', () => {
    const getDates = vi.fn(() => ({ start: new Date('2024-03-01'), end: new Date('2024-03-31') }));
    const timeFrame: TimeFrameFilter = { label: 'March', value: 'march', getDates };

    const expensesWithNoImported: Expense[] = [
      { id: '1', name: 'Test', date: '2024-03-15', category: 'Food', type: 'Debit', amount: 10 },
    ];
    const result = applyFilters(expensesWithNoImported, { timeFrame, entryType: EntryType.IMPORTED });

    expect(result).toHaveLength(0);
    expect(getDates).not.toHaveBeenCalled();
  });
});
