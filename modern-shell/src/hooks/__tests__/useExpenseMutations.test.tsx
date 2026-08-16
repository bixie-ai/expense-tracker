import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useExpenseMutations } from '../useExpenseMutations';

const mockUpdateMutate = vi.fn();
const mockDeleteMutate = vi.fn();

vi.mock('../expenses/useUpdateExpense', () => ({
  useUpdateExpense: () => ({
    mutate: mockUpdateMutate,
    isPending: false,
  }),
}));

vi.mock('../expenses/useDeleteExpense', () => ({
  useDeleteExpense: () => ({
    mutate: mockDeleteMutate,
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useExpenseMutations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call updateExpense with correct parameters', () => {
    const onUpdateSuccess = vi.fn();
    const { result } = renderHook(
      () => useExpenseMutations({ onUpdateSuccess }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.updateExpense('expense-1', {
        name: 'Coffee',
        amount: 5.5,
        date: '2024-01-15',
        category: 'Food',
        comments: '',
      });
    });

    expect(mockUpdateMutate).toHaveBeenCalledWith(
      {
        expenseId: 'expense-1',
        expense: {
          name: 'Coffee',
          amount: 5.5,
          date: '2024-01-15',
          category: 'Food',
          comments: '',
          type: 'Manual',
        },
      },
      expect.objectContaining({
        onSuccess: onUpdateSuccess,
        onError: expect.any(Function),
      }),
    );
  });

  it('should call deleteExpense with correct expenseId', () => {
    const onDeleteSuccess = vi.fn();
    const { result } = renderHook(
      () => useExpenseMutations({ onDeleteSuccess }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.deleteExpense('expense-42');
    });

    expect(mockDeleteMutate).toHaveBeenCalledWith(
      'expense-42',
      expect.objectContaining({
        onSuccess: onDeleteSuccess,
        onError: expect.any(Function),
      }),
    );
  });

  it('should invoke onUpdateError callback on update failure', () => {
    const onUpdateError = vi.fn();
    mockUpdateMutate.mockImplementation((_params, options) => {
      options.onError(new Error('Update failed'));
    });

    const { result } = renderHook(
      () => useExpenseMutations({ onUpdateError }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.updateExpense('expense-1', {
        name: 'Coffee',
        amount: 5.5,
        date: '2024-01-15',
        category: 'Food',
      });
    });

    expect(onUpdateError).toHaveBeenCalledWith(new Error('Update failed'));
  });

  it('should invoke onDeleteError callback on delete failure', () => {
    const onDeleteError = vi.fn();
    mockDeleteMutate.mockImplementation((_id, options) => {
      options.onError(new Error('Delete failed'));
    });

    const { result } = renderHook(
      () => useExpenseMutations({ onDeleteError }),
      { wrapper: createWrapper() },
    );

    act(() => {
      result.current.deleteExpense('expense-1');
    });

    expect(onDeleteError).toHaveBeenCalledWith(new Error('Delete failed'));
  });

  it('should expose isUpdating and isDeleting states', () => {
    const { result } = renderHook(
      () => useExpenseMutations(),
      { wrapper: createWrapper() },
    );

    expect(result.current.isUpdating).toBe(false);
    expect(result.current.isDeleting).toBe(false);
  });
});
