import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useDeleteExpense } from '../useDeleteExpense';
import { expenseKeys } from '../queryKeys';

const mockUserId = 'test-user-456';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mockUserId } }),
}));

vi.mock('../../../api/expenses', () => ({
  deleteExpense: vi.fn(),
}));

import { deleteExpense } from '../../../api/expenses';

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

describe('useDeleteExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call deleteExpense with correct userId and expenseId', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(deleteExpense).mockResolvedValue(undefined);

    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-42');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(deleteExpense).toHaveBeenCalledWith(mockUserId, 'expense-42');
    queryClient.clear();
  });

  it('should invalidate expenses list query on success', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(deleteExpense).mockResolvedValue(undefined);
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-42');

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: expenseKeys.list(mockUserId),
    });
    queryClient.clear();
  });

  it('should expose error state when deletion fails', async () => {
    const { queryClient, wrapper } = createWrapper();
    const error = new Error('Permission denied');
    vi.mocked(deleteExpense).mockRejectedValue(error);

    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-42');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    queryClient.clear();
  });

  it('should not invalidate queries on failure', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(deleteExpense).mockRejectedValue(new Error('fail'));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useDeleteExpense(), { wrapper });

    result.current.mutate('expense-42');

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
    queryClient.clear();
  });
});
