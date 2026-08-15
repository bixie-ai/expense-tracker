import { ref, get, update, remove } from 'firebase/database';
import { database } from '../config/firebase';
import { Expense, ExpenseInput } from '../types/expense';

function expensesRef(userId: string) {
  return ref(database, `users/${userId}/expenses`);
}

function expenseRef(userId: string, expenseId: string) {
  return ref(database, `users/${userId}/expenses/${expenseId}`);
}

export async function fetchExpenses(userId: string): Promise<Expense[]> {
  const snapshot = await get(expensesRef(userId));
  if (!snapshot.exists()) return [];

  const data = snapshot.val() as Record<string, ExpenseInput>;
  return Object.entries(data).map(([id, expense]) => ({
    ...expense,
    id,
  }));
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  expense: ExpenseInput,
): Promise<void> {
  await update(expenseRef(userId, expenseId), expense);
}

export async function deleteExpense(
  userId: string,
  expenseId: string,
): Promise<void> {
  await remove(expenseRef(userId, expenseId));
}
