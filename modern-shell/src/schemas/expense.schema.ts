import { z } from 'zod';

export const expenseSchema = z.object({
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

export const expensesResponseSchema = z.record(z.string(), expenseSchema);

export type Expense = z.infer<typeof expenseSchema>;

export const EntryType = {
  MANUAL: 'manual',
  IMPORTED: 'imported',
} as const;

export type EntryTypeValue = (typeof EntryType)[keyof typeof EntryType];

export interface TimeFrameFilter {
  label: string;
  value: string;
  getDates: () => { start: Date | null; end: Date | null };
  customDateRange?: { start: Date; end: Date };
}

export interface ExpenseFilters {
  timeFrame?: TimeFrameFilter;
  entryType?: EntryTypeValue;
}
