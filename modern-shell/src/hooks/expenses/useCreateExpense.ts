import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { expenseRepository } from '../../core/repositories/expense.repository';
import { ExpenseFormValues } from '../../core/api/schemas';
import { expenseKeys } from './queryKeys';

export function useCreateExpense() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  return useMutation({
    mutationFn: (values: ExpenseFormValues) =>
      expenseRepository.create(userId, {
        name: values.name,
        amount: values.amount,
        date: values.date,
        category: values.category,
        type: values.type,
        comments: values.comments,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: expenseKeys.list(userId) });
    },
  });
}
