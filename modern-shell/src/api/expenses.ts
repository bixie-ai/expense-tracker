import { getDatabase, ref, get } from 'firebase/database';
import { app } from '@/config/firebase';
import { expensesResponseSchema, type Expense } from '@/schemas/expense.schema';

export async function fetchExpenses(userId: string): Promise<Expense[]> {
  const db = getDatabase(app);
  const expensesRef = ref(db, `users/${userId}/expenses`);
  const snapshot = await get(expensesRef);

  if (!snapshot.exists()) {
    return [];
  }

  const raw = snapshot.val();
  const parsed = expensesResponseSchema.parse(raw);

  return Object.entries(parsed).map(([key, expense]) => ({
    ...expense,
    id: key,
  }));
}
