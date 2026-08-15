import { useQuery } from '@tanstack/react-query';
import { fetchExpenses } from '../../api/expenses';
import { useAuth } from '../../contexts/AuthContext';
import { Expense } from '../../types/expense';
import { expenseKeys } from './queryKeys';

export function useExpenses() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';

  return useQuery<Expense[]>({
    queryKey: expenseKeys.list(userId),
    queryFn: () => fetchExpenses(userId),
    enabled: !!userId,
  });
}
