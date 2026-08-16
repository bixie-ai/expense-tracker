import { Expense } from './expense';

export interface ReviewedExpenses {
  debits: Expense[];
  credits: Expense[];
}

export type BulkEditType = 'category' | 'type' | 'delete';

export interface BulkEditDialogData {
  title: string;
  expenses: Expense[];
  confirmButtonText: string;
  editType: BulkEditType;
}

export interface BulkEditDialogResult {
  editForm?: Record<string, string>;
  confirmed?: boolean;
}
