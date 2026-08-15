import { z } from 'zod';

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

export const UserDetailsSchema = z.object({
  firstName: z.string(),
  lastName: z.string(),
});

export type UserDetailsDto = z.infer<typeof UserDetailsSchema>;
