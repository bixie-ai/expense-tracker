import { generateCsvString } from '../csv-generator';
import type { Expense } from '@/types/expense';

describe('generateCsvString', () => {
  describe('headers', () => {
    it('should produce correct CSV headers in the correct order', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 10, date: '2024-01-15', category: 'Food', type: 'expense', comments: '' },
      ];

      const result = generateCsvString(data);
      const headerLine = result.split('\r\n')[0];

      expect(headerLine).toBe('Name,Amount,Date,Category,Type,Comments');
    });
  });

  describe('empty and null inputs', () => {
    it('should return empty string for empty array', () => {
      expect(generateCsvString([])).toBe('');
    });

    it('should return empty string for null-like input', () => {
      expect(generateCsvString(null as unknown as Expense[])).toBe('');
      expect(generateCsvString(undefined as unknown as Expense[])).toBe('');
    });

    it('should handle expense with missing optional fields', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 50, date: '2024-03-01', category: 'Misc', type: 'income' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toBe('Test,50,03-01-2024,Misc,income,');
    });

    it('should handle expense with null comments', () => {
      const data: Expense[] = [
        {
          name: 'Null comment',
          amount: 25,
          date: '2024-06-15',
          category: 'Other',
          type: 'expense',
          comments: undefined,
        },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toBe('Null comment,25,06-15-2024,Other,expense,');
    });
  });

  describe('date formatting', () => {
    it('should format ISO date string as MM-dd-yyyy', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 10, date: '2024-01-05', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toContain('01-05-2024');
    });

    it('should format Date object as MM-dd-yyyy', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 10, date: new Date(2024, 11, 25), category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toContain('12-25-2024');
    });

    it('should handle date string with time component', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 10, date: '2024-07-04T15:30:00Z', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toMatch(/07-04-2024/);
    });

    it('should return empty string for null/undefined date', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 10, date: null as unknown as string, category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toBe('Test,10,,Food,expense,');
    });

    it('should pass through unparseable date strings as-is', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 10, date: 'not-a-date', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toBe('Test,10,not-a-date,Food,expense,');
    });
  });

  describe('amount formatting', () => {
    it('should handle numeric amounts', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 99.99, date: '2024-01-01', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toContain('99.99');
    });

    it('should handle string amounts', () => {
      const data: Expense[] = [
        { name: 'Test', amount: '150.50', date: '2024-01-01', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toContain('150.50');
    });

    it('should handle zero amount', () => {
      const data: Expense[] = [
        { name: 'Test', amount: 0, date: '2024-01-01', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toBe('Test,0,01-01-2024,Food,expense,');
    });

    it('should handle null/undefined amount', () => {
      const data: Expense[] = [
        { name: 'Test', amount: null as unknown as number, date: '2024-01-01', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toBe('Test,,01-01-2024,Food,expense,');
    });
  });

  describe('special characters (CSV escaping)', () => {
    it('should escape fields containing commas', () => {
      const data: Expense[] = [
        { name: 'Lunch, dinner', amount: 25, date: '2024-01-01', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toContain('"Lunch, dinner"');
    });

    it('should escape fields containing double quotes', () => {
      const data: Expense[] = [
        { name: 'The "Big" expense', amount: 100, date: '2024-01-01', category: 'Food', type: 'expense' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows[1]).toContain('"The ""Big"" expense"');
    });

    it('should escape fields containing newlines', () => {
      const data: Expense[] = [
        {
          name: 'Test',
          amount: 10,
          date: '2024-01-01',
          category: 'Food',
          type: 'expense',
          comments: 'line1\nline2',
        },
      ];

      const result = generateCsvString(data);

      expect(result).toContain('"line1\nline2"');
    });

    it('should handle fields with commas and quotes together', () => {
      const data: Expense[] = [
        {
          name: 'Test',
          amount: 10,
          date: '2024-01-01',
          category: 'Food',
          type: 'expense',
          comments: 'He said, "hello"',
        },
      ];

      const result = generateCsvString(data);

      expect(result).toContain('"He said, ""hello"""');
    });
  });

  describe('multiple rows', () => {
    it('should produce correct CSV for multiple expenses', () => {
      const data: Expense[] = [
        { name: 'Groceries', amount: 45.50, date: '2024-03-15', category: 'Food', type: 'expense', comments: '' },
        { name: 'Salary', amount: 5000, date: '2024-03-01', category: 'Income', type: 'income', comments: 'Monthly' },
      ];

      const result = generateCsvString(data);
      const rows = result.split('\r\n');

      expect(rows).toHaveLength(3);
      expect(rows[0]).toBe('Name,Amount,Date,Category,Type,Comments');
      expect(rows[1]).toBe('Groceries,45.5,03-15-2024,Food,expense,');
      expect(rows[2]).toBe('Salary,5000,03-01-2024,Income,income,Monthly');
    });
  });

  describe('performance', () => {
    it('should generate CSV for 1000 rows in under 200ms', () => {
      const data: Expense[] = Array.from({ length: 1000 }, (_, i) => ({
        name: `Expense ${i}`,
        amount: Math.round(Math.random() * 10000) / 100,
        date: '2024-06-15',
        category: 'Category',
        type: 'expense',
        comments: `Comment for item ${i}`,
      }));

      const start = performance.now();
      const result = generateCsvString(data);
      const elapsed = performance.now() - start;

      expect(elapsed).toBeLessThan(200);
      expect(result.split('\r\n')).toHaveLength(1001);
    });
  });
});
