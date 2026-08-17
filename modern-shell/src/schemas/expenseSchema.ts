import { z } from 'zod';
import { EXPENSE_CATEGORIES, PAYMENT_TYPES } from '../core/api/schemas';

export { EXPENSE_CATEGORIES };

export const expenseSchema = z.object({
  name: z.string().min(4, 'Name is required (minimum 4 characters)'),
  amount: z
    .number({ error: 'Amount must be a number' })
    .positive('Amount must be greater than zero'),
  date: z.string().min(1, 'Date is required'),
  category: z.enum(EXPENSE_CATEGORIES, {
    error: 'Please select a category',
  }),
  type: z.enum(PAYMENT_TYPES, {
    error: 'Please select a payment type',
  }),
  comments: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
