import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { parseDate, processAmount, applyAmountRules, parseCsvText, useCsvMapper } from '../hooks/useCsvMapper';
import type { CsvMappingFormValues } from '../utils/csv-validation';

describe('parseDate', () => {
  it('should return a Date object for valid date strings', () => {
    const result = parseDate('2024-01-15');
    expect(result).toBeInstanceOf(Date);
    expect((result as Date).toISOString()).toContain('2024-01-15');
  });

  it('should return a Date for MM/DD/YYYY format', () => {
    const result = parseDate('01/15/2024');
    expect(result).toBeInstanceOf(Date);
  });

  it('should return the original string for invalid dates', () => {
    const result = parseDate('not-a-date');
    expect(result).toBe('not-a-date');
  });

  it('should return the original string for empty input', () => {
    const result = parseDate('');
    expect(typeof result).toBe('string');
  });
});

describe('processAmount', () => {
  it('should parse a clean number', () => {
    expect(processAmount('100.50', 'credit')).toBe(100.50);
  });

  it('should strip dollar signs and commas', () => {
    expect(processAmount('$1,234.56', 'credit')).toBe(1234.56);
  });

  it('should return null for non-numeric values', () => {
    expect(processAmount('abc', 'credit')).toBeNull();
  });

  it('should return null for empty strings', () => {
    expect(processAmount('', 'credit')).toBeNull();
  });

  it('should handle negative amounts with omit strategy', () => {
    expect(processAmount('-50.00', 'omit')).toBeNull();
  });

  it('should pass positive amounts through with omit strategy', () => {
    expect(processAmount('50.00', 'omit')).toBe(50);
  });

  it('should convert negative to positive with credit strategy', () => {
    expect(processAmount('-75.25', 'credit')).toBe(75.25);
  });

  it('should keep positive amounts positive with credit strategy', () => {
    expect(processAmount('75.25', 'credit')).toBe(75.25);
  });

  it('should convert negative to absolute with debit strategy', () => {
    expect(processAmount('-100', 'debit')).toBe(100);
  });

  it('should keep positive amounts positive with debit strategy', () => {
    expect(processAmount('100', 'debit')).toBe(100);
  });
});

describe('applyAmountRules', () => {
  describe('omit strategy', () => {
    it('should return null for negative amounts', () => {
      expect(applyAmountRules(-50, 'omit')).toBeNull();
    });

    it('should return the amount for positive values', () => {
      expect(applyAmountRules(50, 'omit')).toBe(50);
    });

    it('should return zero for zero', () => {
      expect(applyAmountRules(0, 'omit')).toBe(0);
    });
  });

  describe('credit strategy', () => {
    it('should negate negative amounts (make positive)', () => {
      expect(applyAmountRules(-30, 'credit')).toBe(30);
    });

    it('should keep positive amounts unchanged', () => {
      expect(applyAmountRules(30, 'credit')).toBe(30);
    });
  });

  describe('debit strategy', () => {
    it('should take absolute value of negative amounts', () => {
      expect(applyAmountRules(-75, 'debit')).toBe(75);
    });

    it('should keep positive amounts unchanged', () => {
      expect(applyAmountRules(75, 'debit')).toBe(75);
    });
  });
});

describe('parseCsvText', () => {
  it('should parse headers and rows from CSV text', () => {
    const csv = 'Name,Amount,Date\nCoffee,5.00,2024-01-01\nLunch,12.50,2024-01-02';
    const { headers, rows } = parseCsvText(csv);

    expect(headers).toEqual(['Name', 'Amount', 'Date']);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toEqual({ Name: 'Coffee', Amount: '5.00', Date: '2024-01-01' });
    expect(rows[1]).toEqual({ Name: 'Lunch', Amount: '12.50', Date: '2024-01-02' });
  });

  it('should handle empty input', () => {
    const { headers, rows } = parseCsvText('');
    expect(headers).toEqual([]);
    expect(rows).toEqual([]);
  });

  it('should handle CSV with only headers', () => {
    const { headers, rows } = parseCsvText('Name,Amount,Date');
    expect(headers).toEqual(['Name', 'Amount', 'Date']);
    expect(rows).toEqual([]);
  });

  it('should handle quoted fields with commas', () => {
    const csv = 'Name,Amount\n"Smith, John",100.00';
    const { rows } = parseCsvText(csv);
    expect(rows[0]['Name']).toBe('Smith, John');
  });

  it('should handle escaped quotes within quoted fields', () => {
    const csv = 'Name,Amount\n"He said ""hello""",50';
    const { rows } = parseCsvText(csv);
    expect(rows[0]['Name']).toBe('He said "hello"');
  });

  it('should handle Windows line endings', () => {
    const csv = 'Name,Amount\r\nCoffee,5.00\r\nTea,3.00';
    const { headers, rows } = parseCsvText(csv);
    expect(headers).toEqual(['Name', 'Amount']);
    expect(rows).toHaveLength(2);
  });

  it('should skip empty lines', () => {
    const csv = 'Name,Amount\n\nCoffee,5.00\n\n';
    const { rows } = parseCsvText(csv);
    expect(rows).toHaveLength(1);
  });

  it('should handle missing values in rows', () => {
    const csv = 'Name,Amount,Date\nCoffee,5.00';
    const { rows } = parseCsvText(csv);
    expect(rows[0]).toEqual({ Name: 'Coffee', Amount: '5.00', Date: '' });
  });
});

describe('useCsvMapper', () => {
  const csvData = [
    { Description: 'Coffee', Total: '5.00', TransDate: '2024-01-01' },
    { Description: 'Lunch', Total: '12.50', TransDate: '2024-01-02' },
    { Description: 'Refund', Total: '-25.00', TransDate: '2024-01-03' },
  ];

  const baseFormValues: CsvMappingFormValues = {
    name: 'Description',
    amount: 'Total',
    date: 'TransDate',
    category: '',
    type: '',
    comments: '',
    handleNegativeAmounts: 'credit',
  };

  it('should generate expenses from CSV data with valid mapping', () => {
    const { result } = renderHook(() => useCsvMapper({ csvData, fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses(baseFormValues);

    expect(expenses).toHaveLength(3);
    expect(expenses[0].name).toBe('Coffee');
    expect(expenses[0].amount).toBe(5.00);
    expect(expenses[0].importedFrom).toBe('test.csv');
    expect(expenses[0].category).toBe('Unassigned');
    expect(expenses[0].type).toBe('Debit');
  });

  it('should apply credit strategy for negative amounts', () => {
    const { result } = renderHook(() => useCsvMapper({ csvData, fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses(baseFormValues);

    expect(expenses[2].amount).toBe(25.00);
  });

  it('should omit rows with negative amounts when using omit strategy', () => {
    const { result } = renderHook(() => useCsvMapper({ csvData, fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses({
      ...baseFormValues,
      handleNegativeAmounts: 'omit',
    });

    expect(expenses).toHaveLength(2);
    expect(expenses.every((e) => typeof e.amount === 'number' && e.amount > 0)).toBe(true);
  });

  it('should return empty array when csvData is empty', () => {
    const { result } = renderHook(() => useCsvMapper({ csvData: [], fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses(baseFormValues);

    expect(expenses).toEqual([]);
  });

  it('should skip rows where required fields produce invalid data', () => {
    const dataWithInvalid = [
      { Description: 'Coffee', Total: 'not-a-number', TransDate: '2024-01-01' },
      { Description: 'Lunch', Total: '12.50', TransDate: '2024-01-02' },
    ];

    const { result } = renderHook(() => useCsvMapper({ csvData: dataWithInvalid, fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses(baseFormValues);

    expect(expenses).toHaveLength(1);
    expect(expenses[0].name).toBe('Lunch');
  });

  it('should map optional category field when provided', () => {
    const dataWithCategory = [
      { Description: 'Coffee', Total: '5.00', TransDate: '2024-01-01', Cat: 'Food' },
    ];

    const { result } = renderHook(() => useCsvMapper({ csvData: dataWithCategory, fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses({
      ...baseFormValues,
      category: 'Cat',
    });

    expect(expenses[0].category).toBe('Food');
  });

  it('should default category to Unassigned when optional field is empty', () => {
    const dataWithEmptyCategory = [
      { Description: 'Coffee', Total: '5.00', TransDate: '2024-01-01', Cat: '' },
    ];

    const { result } = renderHook(() => useCsvMapper({ csvData: dataWithEmptyCategory, fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses({
      ...baseFormValues,
      category: 'Cat',
    });

    expect(expenses[0].category).toBe('Unassigned');
  });

  it('should set importedOn to a Date instance', () => {
    const { result } = renderHook(() => useCsvMapper({ csvData: csvData.slice(0, 1), fileName: 'test.csv' }));
    const expenses = result.current.generateExpenses(baseFormValues);

    expect(expenses[0].importedOn).toBeInstanceOf(Date);
  });

  it('should handle large datasets efficiently', () => {
    const largeData = Array.from({ length: 1000 }, (_, i) => ({
      Description: `Expense ${i}`,
      Total: `${(i * 1.5).toFixed(2)}`,
      TransDate: '2024-01-01',
    }));

    const { result } = renderHook(() => useCsvMapper({ csvData: largeData, fileName: 'big.csv' }));

    const start = performance.now();
    const expenses = result.current.generateExpenses(baseFormValues);
    const elapsed = performance.now() - start;

    expect(expenses).toHaveLength(1000);
    expect(elapsed).toBeLessThan(50);
  });
});
