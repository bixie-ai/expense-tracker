import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUpdateExpense } from '../useUpdateExpense';
import { expenseKeys } from '../queryKeys';

const mockUserId = 'test-user-123';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mockUserId } }),
}));

vi.mock('../../../api/expenses', () => ({
  updateExpense: vi.fn(),
}));

import { updateExpense } from '../../../api/expenses';

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return {
    queryClient,
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  };
}

describe('useUpdateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateExpense with correct parameters on mutate', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(updateExpense).mockResolvedValue(undefined);

    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      expenseId: 'expense-1',
      expense: { name: 'Coffee', date: '2024-01-15', category: 'Food', type: 'Manual', amount: 5.5 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(updateExpense).toHaveBeenCalledWith(
      mockUserId,
      'expense-1',
      { name: 'Coffee', date: '2024-01-15', category: 'Food', type: 'Manual', amount: 5.5 },
    );
    queryClient.clear();
  });

  it('should invalidate expenses list query on success', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(updateExpense).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      expenseId: 'expense-1',
      expense: { name: 'Coffee', date: '2024-01-15', category: 'Food', type: 'Manual', amount: 5.5 },
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: expenseKeys.list(mockUserId),
    });
    queryClient.clear();
  });

  it('should expose error state when mutation fails', async () => {
    const { queryClient, wrapper } = createWrapper();
    const error = new Error('Network error');
    vi.mocked(updateExpense).mockRejectedValue(error);

    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      expenseId: 'expense-1',
      expense: { name: 'Coffee', date: '2024-01-15', category: 'Food', type: 'Manual', amount: 5.5 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    queryClient.clear();
  });

  it('should not invalidate queries on failure', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(updateExpense).mockRejectedValue(new Error('fail'));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useUpdateExpense(), { wrapper });

    result.current.mutate({
      expenseId: 'expense-1',
      expense: { name: 'Coffee', date: '2024-01-15', category: 'Food', type: 'Manual', amount: 5.5 },
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
    queryClient.clear();
  });
});
