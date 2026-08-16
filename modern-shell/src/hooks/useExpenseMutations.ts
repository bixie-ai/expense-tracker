import { useUpdateExpense } from './expenses/useUpdateExpense';
import { useDeleteExpense } from './expenses/useDeleteExpense';
import { ExpenseFormData } from '../schemas/expenseSchema';

export interface UseExpenseMutationsOptions {
  onUpdateSuccess?: () => void;
  onUpdateError?: (error: Error) => void;
  onDeleteSuccess?: () => void;
  onDeleteError?: (error: Error) => void;
}

export function useExpenseMutations(options: UseExpenseMutationsOptions = {}) {
  const updateMutation = useUpdateExpense();
  const deleteMutation = useDeleteExpense();

  const updateExpense = (expenseId: string, data: ExpenseFormData) => {
    updateMutation.mutate(
      {
        expenseId,
        expense: {
          ...data,
          type: 'Manual',
        },
      },
      {
        onSuccess: options.onUpdateSuccess,
        onError: (error: Error) => options.onUpdateError?.(error),
      },
    );
  };

  const deleteExpense = (expenseId: string) => {
    deleteMutation.mutate(expenseId, {
      onSuccess: options.onDeleteSuccess,
      onError: (error: Error) => options.onDeleteError?.(error),
    });
  };

  return {
    updateExpense,
    deleteExpense,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  };
}
