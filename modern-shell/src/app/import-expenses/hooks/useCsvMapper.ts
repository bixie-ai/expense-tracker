import { useMemo, useCallback } from 'react';
import type { Expense } from '@/types/expense';
import type { CsvRow, CsvMappingFormValues, NegativeAmountHandling, ExpenseKey } from '../utils/csv-validation';
import { EXPENSE_PROPERTIES } from '../utils/csv-validation';

export interface UseCsvMapperOptions {
  csvData: CsvRow[];
  fileName: string;
}

export interface UseCsvMapperResult {
  generateExpenses: (formValues: CsvMappingFormValues) => Expense[];
  parseCsvText: (text: string) => { headers: string[]; rows: CsvRow[] };
}

export function parseDate(value: string): Date | string {
  const parsedDate = new Date(value);
  return !isNaN(parsedDate.getTime()) ? parsedDate : value;
}

export function processAmount(value: string, handleNegativeAmounts: NegativeAmountHandling): number | null {
  const cleanAmount = value.replace(/[$,]/g, '');
  const numAmount = parseFloat(cleanAmount);

  if (isNaN(numAmount)) return null;

  return applyAmountRules(numAmount, handleNegativeAmounts);
}

export function applyAmountRules(amount: number, handleNegativeAmounts: NegativeAmountHandling): number | null {
  const isNegative = amount < 0;

  switch (handleNegativeAmounts) {
    case 'omit':
      return isNegative ? null : amount;
    case 'credit':
      return isNegative ? -amount : amount;
    case 'debit':
      return isNegative ? Math.abs(amount) : amount;
    default:
      return amount;
  }
}

export function parseCsvText(text: string): { headers: string[]; rows: CsvRow[] } {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]);
  const rows: CsvRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const row: CsvRow = {};
    headers.forEach((header, idx) => {
      row[header] = values[idx] ?? '';
    });
    rows.push(row);
  }

  return { headers, rows };
}

function mapPropertyToExpense(
  expense: Partial<Expense>,
  propertyKey: ExpenseKey,
  value: string,
  handleNegativeAmounts: NegativeAmountHandling
): void {
  switch (propertyKey) {
    case 'date':
      expense.date = parseDate(value);
      break;
    case 'amount': {
      const processed = processAmount(value, handleNegativeAmounts);
      if (processed === null) {
        expense.amount = undefined as unknown as number;
        return;
      }
      expense.amount = processed;
      break;
    }
    case 'category':
      expense.category = value || 'Unassigned';
      break;
    case 'type':
      expense.type = value || 'Debit';
      break;
    case 'comments':
      expense.comments = value || '';
      break;
    case 'name':
      expense.name = value || 'Unnamed Expense';
      break;
  }
}

function validateExpense(expense: Partial<Expense>): Expense | null {
  const requiredFields = EXPENSE_PROPERTIES.filter((p) => p.required).map((p) => p.key);
  const hasAllRequired = requiredFields.every((field) => {
    const val = expense[field];
    return val !== undefined && val !== null && val !== '';
  });
  return hasAllRequired ? (expense as Expense) : null;
}

export function useCsvMapper({ csvData, fileName }: UseCsvMapperOptions): UseCsvMapperResult {
  const generateExpenses = useCallback(
    (formValues: CsvMappingFormValues): Expense[] => {
      if (!csvData.length) return [];

      const expenses: Expense[] = [];

      for (const row of csvData) {
        const expense: Partial<Expense> = {
          importedOn: new Date(),
          importedFrom: fileName,
          category: 'Unassigned',
          type: 'Debit',
          comments: '',
        };

        for (const prop of EXPENSE_PROPERTIES) {
          const mappedColumn = formValues[prop.key];
          if (mappedColumn) {
            const value = row[mappedColumn] ?? '';
            mapPropertyToExpense(expense, prop.key, value, formValues.handleNegativeAmounts);
          }
        }

        const validated = validateExpense(expense);
        if (validated) {
          expenses.push(validated);
        }
      }

      return expenses;
    },
    [csvData, fileName]
  );

  const result = useMemo<UseCsvMapperResult>(
    () => ({ generateExpenses, parseCsvText }),
    [generateExpenses]
  );

  return result;
}
