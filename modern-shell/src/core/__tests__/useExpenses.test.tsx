import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useExpenses } from '../hooks/useExpenses';

const mockGetByUser = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockDelete = vi.fn();

vi.mock('../repositories/expense.repository', () => ({
  expenseRepository: {
    getByUser: (...args: unknown[]) => mockGetByUser(...args),
    create: (...args: unknown[]) => mockCreate(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
    delete: (...args: unknown[]) => mockDelete(...args),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch expenses for the authenticated user', async () => {
    const expenses = [
      { id: '1', name: 'Lunch', date: '2024-01-15', category: 'Food', type: 'expense', amount: 25 },
      { id: '2', name: 'Taxi', date: '2024-01-16', category: 'Transport', type: 'expense', amount: 15 },
    ];
    mockGetByUser.mockResolvedValue(expenses);

    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(expenses);
    expect(mockGetByUser).toHaveBeenCalledWith('test-user-123');
  });

  it('should use provided userId over auth context', async () => {
    mockGetByUser.mockResolvedValue([]);

    const { result } = renderHook(() => useExpenses('custom-user'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGetByUser).toHaveBeenCalledWith('custom-user');
  });

  it('should create an expense and invalidate the query', async () => {
    mockGetByUser.mockResolvedValue([]);
    const newExpense = { name: 'Coffee', date: '2024-03-01', category: 'Drinks', type: 'expense', amount: 5 };
    mockCreate.mockResolvedValue({ ...newExpense, id: 'new-1' });

    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      result.current.createExpense.mutate(newExpense);
    });

    await waitFor(() => expect(result.current.createExpense.isSuccess).toBe(true));
    expect(mockCreate).toHaveBeenCalledWith('test-user-123', newExpense);
  });

  it('should update an expense and invalidate the query', async () => {
    mockGetByUser.mockResolvedValue([]);
    const updatedExpense = { name: 'Updated Lunch', date: '2024-01-15', category: 'Food', type: 'expense', amount: 30 };
    mockUpdate.mockResolvedValue({ ...updatedExpense, id: 'exp-1' });

    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      result.current.updateExpense.mutate({ expenseId: 'exp-1', expense: updatedExpense });
    });

    await waitFor(() => expect(result.current.updateExpense.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith('test-user-123', 'exp-1', updatedExpense);
  });

  it('should delete an expense and invalidate the query', async () => {
    mockGetByUser.mockResolvedValue([]);
    mockDelete.mockResolvedValue(undefined);

    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      result.current.deleteExpense.mutate('exp-1');
    });

    await waitFor(() => expect(result.current.deleteExpense.isSuccess).toBe(true));
    expect(mockDelete).toHaveBeenCalledWith('test-user-123', 'exp-1');
  });

  it('should handle fetch error', async () => {
    mockGetByUser.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useExpenses(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});
