import { describe, it, expect } from 'vitest';
import { ExpenseSchema, ExpenseInputSchema, UserDetailsSchema } from '../api/schemas';

describe('ExpenseSchema', () => {
  it('should validate a valid expense with all fields', () => {
    const expense = {
      id: 'abc123',
      name: 'Lunch',
      date: '2024-01-15',
      category: 'Food',
      type: 'expense',
      amount: 25.5,
      comments: 'Team lunch',
      importedFrom: 'csv-import',
    };
    const result = ExpenseSchema.parse(expense);
    expect(result).toEqual(expense);
  });

  it('should validate an expense with minimal required fields', () => {
    const expense = {
      name: 'Coffee',
      date: '2024-03-01',
      category: 'Drinks',
      type: 'expense',
      amount: 5,
    };
    const result = ExpenseSchema.parse(expense);
    expect(result.name).toBe('Coffee');
    expect(result.id).toBeUndefined();
    expect(result.comments).toBeUndefined();
  });

  it('should accept amount as string', () => {
    const expense = {
      name: 'Taxi',
      date: '2024-02-10',
      category: 'Transport',
      type: 'expense',
      amount: '42.00',
    };
    const result = ExpenseSchema.parse(expense);
    expect(result.amount).toBe('42.00');
  });

  it('should accept date as Date object', () => {
    const date = new Date('2024-06-15');
    const expense = {
      name: 'Rent',
      date,
      category: 'Housing',
      type: 'expense',
      amount: 1200,
    };
    const result = ExpenseSchema.parse(expense);
    expect(result.date).toEqual(date);
  });

  it('should reject expense missing required name', () => {
    const expense = {
      date: '2024-01-01',
      category: 'Food',
      type: 'expense',
      amount: 10,
    };
    expect(() => ExpenseSchema.parse(expense)).toThrow();
  });

  it('should reject expense missing required category', () => {
    const expense = {
      name: 'Test',
      date: '2024-01-01',
      type: 'expense',
      amount: 10,
    };
    expect(() => ExpenseSchema.parse(expense)).toThrow();
  });

  it('should reject expense missing required type', () => {
    const expense = {
      name: 'Test',
      date: '2024-01-01',
      category: 'Food',
      amount: 10,
    };
    expect(() => ExpenseSchema.parse(expense)).toThrow();
  });

  it('should reject expense missing required amount', () => {
    const expense = {
      name: 'Test',
      date: '2024-01-01',
      category: 'Food',
      type: 'expense',
    };
    expect(() => ExpenseSchema.parse(expense)).toThrow();
  });

  it('should coerce importedOn string to Date', () => {
    const expense = {
      name: 'Imported',
      date: '2024-01-01',
      category: 'Food',
      type: 'expense',
      amount: 15,
      importedOn: '2024-03-20T10:00:00Z',
    };
    const result = ExpenseSchema.parse(expense);
    expect(result.importedOn).toBeInstanceOf(Date);
  });
});

describe('ExpenseInputSchema', () => {
  it('should validate input without id', () => {
    const input = {
      name: 'Groceries',
      date: '2024-04-01',
      category: 'Food',
      type: 'expense',
      amount: 85.5,
    };
    const result = ExpenseInputSchema.parse(input);
    expect(result).toEqual(input);
    expect('id' in result).toBe(false);
  });

  it('should reject input with invalid types', () => {
    const input = {
      name: 123,
      date: '2024-04-01',
      category: 'Food',
      type: 'expense',
      amount: 10,
    };
    expect(() => ExpenseInputSchema.parse(input)).toThrow();
  });
});

describe('UserDetailsSchema', () => {
  it('should validate valid user details', () => {
    const details = { firstName: 'John', lastName: 'Doe' };
    const result = UserDetailsSchema.parse(details);
    expect(result).toEqual(details);
  });

  it('should reject missing firstName', () => {
    expect(() => UserDetailsSchema.parse({ lastName: 'Doe' })).toThrow();
  });

  it('should reject missing lastName', () => {
    expect(() => UserDetailsSchema.parse({ firstName: 'John' })).toThrow();
  });

  it('should reject non-string firstName', () => {
    expect(() => UserDetailsSchema.parse({ firstName: 42, lastName: 'Doe' })).toThrow();
  });

  it('should reject empty object', () => {
    expect(() => UserDetailsSchema.parse({})).toThrow();
  });
});
