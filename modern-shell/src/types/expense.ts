export interface Expense {
  id?: string;
  name: string;
  date: Date | string;
  category: string;
  type: string;
  amount: number | string;
  comments?: string;
  importedOn?: Date;
  importedFrom?: string;
}

export type ExpenseInput = Omit<Expense, 'id'>;

export interface UpdateExpenseParams {
  userId: string;
  expenseId: string;
  expense: ExpenseInput;
}

export interface DeleteExpenseParams {
  userId: string;
  expenseId: string;
}
