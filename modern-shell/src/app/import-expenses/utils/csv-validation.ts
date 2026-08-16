import { z } from 'zod';

export type CsvRow = Record<string, string>;

export type ExpenseKey = 'name' | 'amount' | 'date' | 'category' | 'type' | 'comments';

export type NegativeAmountHandling = 'omit' | 'credit' | 'debit';

export interface ExpenseProperty {
  key: ExpenseKey;
  label: string;
  required: boolean;
}

export const EXPENSE_PROPERTIES: ExpenseProperty[] = [
  { key: 'name', label: 'Expense Name', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'date', label: 'Date', required: true },
  { key: 'category', label: 'Category', required: false },
  { key: 'type', label: 'Payment Type', required: false },
  { key: 'comments', label: 'Comments', required: false },
];

export const NEGATIVE_AMOUNT_OPTIONS = [
  { label: 'Omit Negative Amounts', value: 'omit' as const },
  { label: 'Treat Negative Amounts as Credits', value: 'credit' as const },
  { label: 'Treat Negative Amounts as Debits', value: 'debit' as const },
];

export interface CsvMappingFormValues {
  name: string;
  amount: string;
  date: string;
  category: string;
  type: string;
  comments: string;
  handleNegativeAmounts: NegativeAmountHandling;
}

export function createCsvMappingSchema(csvHeaders: string[]) {
  const headerEnum = csvHeaders.length > 0 ? csvHeaders : [''];

  const baseSchema = z.object({
    name: z.enum(headerEnum as [string, ...string[]], 'Please select a column for Expense Name'),
    amount: z.enum(headerEnum as [string, ...string[]], 'Please select a column for Amount'),
    date: z.enum(headerEnum as [string, ...string[]], 'Please select a column for Date'),
    category: z.string().default(''),
    type: z.string().default(''),
    comments: z.string().default(''),
    handleNegativeAmounts: z.enum(['omit', 'credit', 'debit'] as const, 'Please select how to handle negative amounts'),
  });

  return baseSchema.refine(
    (data) => {
      const mappedColumns = [data.name, data.amount, data.date, data.category, data.type, data.comments]
        .filter((v) => v !== '' && v !== undefined);
      const unique = new Set(mappedColumns);
      return unique.size === mappedColumns.length;
    },
    {
      message: 'Each CSV column can only be mapped to one expense field',
      path: ['_duplicateMapping'],
    }
  );
}

export function findDuplicateMappings(values: CsvMappingFormValues): Record<string, string> {
  const errors: Record<string, string> = {};
  const mappingKeys: ExpenseKey[] = ['name', 'amount', 'date', 'category', 'type', 'comments'];

  const selectedValues = mappingKeys
    .map((key) => ({ key, value: values[key] }))
    .filter(({ value }) => value !== '' && value !== undefined);

  const seen = new Map<string, string>();
  for (const { key, value } of selectedValues) {
    if (seen.has(value)) {
      errors[key] = `Column "${value}" is already mapped`;
      errors[seen.get(value)!] = `Column "${value}" is already mapped`;
    } else {
      seen.set(value, key);
    }
  }

  return errors;
}
