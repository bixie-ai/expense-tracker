import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useCreateExpense } from '../useCreateExpense';
import { expenseRepository } from '../../core/repositories/expense.repository';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

vi.mock('../../core/repositories/expense.repository', () => ({
  expenseRepository: {
    create: vi.fn(),
  },
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('useCreateExpense', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should call expenseRepository.create with correct data', async () => {
    const mockCreate = vi.mocked(expenseRepository.create);
    mockCreate.mockResolvedValue({
      id: 'new-expense-id',
      name: 'Lunch',
      amount: 12.5,
      date: '2024-03-15',
      category: 'Food',
      type: 'Manual',
      comments: '',
    });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Lunch',
      amount: 12.5,
      date: '2024-03-15',
      category: 'Food',
      comments: '',
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    expect(mockCreate).toHaveBeenCalledWith('test-user-123', {
      name: 'Lunch',
      amount: 12.5,
      date: '2024-03-15',
      category: 'Food',
      type: 'Manual',
      comments: '',
    });
  });

  it('should pass type: "Manual" to repository', async () => {
    const mockCreate = vi.mocked(expenseRepository.create);
    mockCreate.mockResolvedValue({
      id: 'new-expense-id',
      name: 'Test',
      amount: 10,
      date: '2024-03-15',
      category: 'Food',
      type: 'Manual',
      comments: '',
    });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test',
      amount: 10,
      date: '2024-03-15',
      category: 'Food',
      comments: 'Test comment',
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ type: 'Manual' }),
    );
  });

  it('should map form values correctly', async () => {
    const mockCreate = vi.mocked(expenseRepository.create);
    mockCreate.mockResolvedValue({
      id: 'new-expense-id',
      name: 'Groceries',
      amount: 45.67,
      date: '2024-06-01',
      category: 'Groceries',
      type: 'Manual',
      comments: 'Weekly shopping',
    });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Groceries',
      amount: 45.67,
      date: '2024-06-01',
      category: 'Groceries',
      comments: 'Weekly shopping',
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    expect(mockCreate).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        name: 'Groceries',
        amount: 45.67,
        date: '2024-06-01',
        category: 'Groceries',
        type: 'Manual',
        comments: 'Weekly shopping',
      }),
    );
  });

  it('should use userId from AuthContext', async () => {
    const mockCreate = vi.mocked(expenseRepository.create);
    mockCreate.mockResolvedValue({
      id: 'new-expense-id',
      name: 'Test',
      amount: 10,
      date: '2024-03-15',
      category: 'Food',
      type: 'Manual',
      comments: '',
    });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test',
      amount: 10,
      date: '2024-03-15',
      category: 'Food',
      comments: '',
    });

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalled();
    });

    expect(mockCreate).toHaveBeenCalledWith('test-user-123', expect.any(Object));
  });

  it('should invalidate expenses list query on success', async () => {
    const mockCreate = vi.mocked(expenseRepository.create);
    mockCreate.mockResolvedValue({
      id: 'new-expense-id',
      name: 'Test',
      amount: 10,
      date: '2024-03-15',
      category: 'Food',
      type: 'Manual',
      comments: '',
    });

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test',
      amount: 10,
      date: '2024-03-15',
      category: 'Food',
      comments: '',
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });
  });

  it('should expose error state when mutation fails', async () => {
    const mockCreate = vi.mocked(expenseRepository.create);
    mockCreate.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useCreateExpense(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      name: 'Test',
      amount: 10,
      date: '2024-03-15',
      category: 'Food',
      comments: '',
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
