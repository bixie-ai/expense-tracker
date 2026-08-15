import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateExpense } from '../../api/expenses';
import { useAuth } from '../../contexts/AuthContext';
import { UpdateExpenseParams } from '../../types/expense';
import { expenseKeys } from './queryKeys';

export function useUpdateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  return useMutation({
    mutationFn: (params: Omit<UpdateExpenseParams, 'userId'>) =>
      updateExpense(userId, params.expenseId, params.expense),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(userId) });
    },
  });
}
