import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { expenseRepository } from '../repositories/expense.repository';
import { ExpenseDto, ExpenseInputDto } from '../api/schemas';

export const expenseQueryKeys = {
  all: ['expenses'] as const,
  list: (userId: string) => [...expenseQueryKeys.all, 'list', userId] as const,
};

export function useExpenses(userId?: string) {
  const { user } = useAuth();
  const resolvedUserId = userId ?? user?.uid ?? '';
  const queryClient = useQueryClient();

  const query = useQuery<ExpenseDto[]>({
    queryKey: expenseQueryKeys.list(resolvedUserId),
    queryFn: () => expenseRepository.getByUser(resolvedUserId),
    enabled: !!resolvedUserId,
  });

  const createMutation = useMutation({
    mutationFn: (expense: ExpenseInputDto) =>
      expenseRepository.create(resolvedUserId, expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.list(resolvedUserId) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ expenseId, expense }: { expenseId: string; expense: ExpenseInputDto }) =>
      expenseRepository.update(resolvedUserId, expenseId, expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.list(resolvedUserId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) =>
      expenseRepository.delete(resolvedUserId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseQueryKeys.list(resolvedUserId) });
    },
  });

  return {
    ...query,
    createExpense: createMutation,
    updateExpense: updateMutation,
    deleteExpense: deleteMutation,
  };
}
