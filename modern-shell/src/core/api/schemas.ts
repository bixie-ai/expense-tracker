import { z } from 'zod';

export const EXPENSE_CATEGORIES = [
  'Groceries',
  'Transportation',
  'Entertainment',
  'Dining out',
  'Shopping',
  'Bills',
  'Health',
  'Education',
  'Travel',
  'Other',
] as const;

export const PAYMENT_TYPES = ['Credit', 'Debit', 'Cash'] as const;

export const ExpenseSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  date: z.union([z.string(), z.coerce.date()]),
  category: z.string(),
  type: z.string(),
  amount: z.union([z.number(), z.string()]),
  comments: z.string().optional(),
  importedOn: z.coerce.date().optional(),
  importedFrom: z.string().optional(),
});

export type ExpenseDto = z.infer<typeof ExpenseSchema>;

export const ExpenseInputSchema = ExpenseSchema.omit({ id: true });

export type ExpenseInputDto = z.infer<typeof ExpenseInputSchema>;

export const ExpenseFormSchema = z.object({
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

export type ExpenseFormValues = z.infer<typeof ExpenseFormSchema>;

export const UserDetailsSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

export type UserDetailsDto = z.infer<typeof UserDetailsSchema>;
