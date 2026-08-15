import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteExpense } from '../../api/expenses';
import { useAuth } from '../../contexts/AuthContext';
import { expenseKeys } from './queryKeys';

export function useDeleteExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  return useMutation({
    mutationFn: (expenseId: string) => deleteExpense(userId, expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(userId) });
    },
  });
}
