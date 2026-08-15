import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useCreateExpense } from '../useCreateExpense';
import { expenseKeys } from '../queryKeys';

const mockUserId = 'test-user-123';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mockUserId } }),
}));

vi.mock('../../../core/repositories/expense.repository', () => ({
  expenseRepository: {
    create: vi.fn(),
  },
}));

import { expenseRepository } from '../../../core/repositories/expense.repository';

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

describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call expenseRepository.create with userId and mapped expense data', async () => {
    const { queryClient, wrapper } = createWrapper();
    const mockResult = { id: 'new-1', name: 'Lunch', amount: 12.5, date: '2024-03-15', category: 'Food', type: 'Manual' };
    vi.mocked(expenseRepository.create).mockResolvedValue(mockResult);

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      name: 'Lunch',
      amount: 12.5,
      date: '2024-03-15',
      category: 'Food',
      comments: 'Team lunch',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(expenseRepository.create).toHaveBeenCalledWith(mockUserId, {
      name: 'Lunch',
      amount: 12.5,
      date: '2024-03-15',
      category: 'Food',
      type: 'Manual',
      comments: 'Team lunch',
    });
    queryClient.clear();
  });

  it('should invalidate expenses list query on success', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(expenseRepository.create).mockResolvedValue({ id: 'new-1', name: 'Test', amount: 5, date: '2024-01-01', category: 'Other', type: 'Manual' });
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      name: 'Test',
      amount: 5,
      date: '2024-01-01',
      category: 'Other',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(invalidateSpy).toHaveBeenCalledWith({
      queryKey: expenseKeys.list(mockUserId),
    });
    queryClient.clear();
  });

  it('should expose error state when mutation fails', async () => {
    const { queryClient, wrapper } = createWrapper();
    const error = new Error('Firebase write failed');
    vi.mocked(expenseRepository.create).mockRejectedValue(error);

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      name: 'Test',
      amount: 10,
      date: '2024-01-01',
      category: 'Food',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(result.current.error).toBe(error);
    queryClient.clear();
  });

  it('should not invalidate queries on failure', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(expenseRepository.create).mockRejectedValue(new Error('fail'));
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      name: 'Test',
      amount: 10,
      date: '2024-01-01',
      category: 'Food',
    });

    await waitFor(() => expect(result.current.isError).toBe(true));

    expect(invalidateSpy).not.toHaveBeenCalled();
    queryClient.clear();
  });

  it('should set type to Manual for all created expenses', async () => {
    const { queryClient, wrapper } = createWrapper();
    vi.mocked(expenseRepository.create).mockResolvedValue({ id: 'new-2', name: 'Bus', amount: 3, date: '2024-02-01', category: 'Transport', type: 'Manual' });

    const { result } = renderHook(() => useCreateExpense(), { wrapper });

    result.current.mutate({
      name: 'Bus',
      amount: 3,
      date: '2024-02-01',
      category: 'Transport',
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(vi.mocked(expenseRepository.create).mock.calls[0][1]).toHaveProperty('type', 'Manual');
    queryClient.clear();
  });
});
