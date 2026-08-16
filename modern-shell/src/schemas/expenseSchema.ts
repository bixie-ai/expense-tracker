import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Education',
  'Travel',
  'Other',
] as const;

export const expenseSchema = z.object({
  name: z.string().min(1, 'Description is required'),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than zero'),
  date: z.string().min(1, 'Date is required'),
  category: z.enum(EXPENSE_CATEGORIES, {
    error: 'Please select a category',
  }),
  comments: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
