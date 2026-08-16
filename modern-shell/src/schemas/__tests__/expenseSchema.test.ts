import { describe, it, expect } from 'vitest';
import { expenseSchema, EXPENSE_CATEGORIES } from '../expenseSchema';

describe('expenseSchema', () => {
  const validData = {
    name: 'Coffee',
    amount: 5.5,
    date: '2024-03-15',
    category: 'Food' as const,
    comments: 'Morning coffee',
  };

  it('should validate a complete valid expense', () => {
    const result = expenseSchema.safeParse(validData);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual(validData);
    }
  });

  it('should validate without optional comments', () => {
    const { comments: _, ...withoutComments } = validData;
    const result = expenseSchema.safeParse(withoutComments);
    expect(result.success).toBe(true);
  });

  it('should reject empty name', () => {
    const result = expenseSchema.safeParse({ ...validData, name: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const nameError = result.error.issues.find((i) => i.path.includes('name'));
      expect(nameError?.message).toBe('Description is required');
    }
  });

  it('should reject negative amount', () => {
    const result = expenseSchema.safeParse({ ...validData, amount: -10 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const amountError = result.error.issues.find((i) => i.path.includes('amount'));
      expect(amountError?.message).toBe('Amount must be greater than zero');
    }
  });

  it('should reject zero amount', () => {
    const result = expenseSchema.safeParse({ ...validData, amount: 0 });
    expect(result.success).toBe(false);
    if (!result.success) {
      const amountError = result.error.issues.find((i) => i.path.includes('amount'));
      expect(amountError?.message).toBe('Amount must be greater than zero');
    }
  });

  it('should reject non-numeric amount', () => {
    const result = expenseSchema.safeParse({ ...validData, amount: 'abc' });
    expect(result.success).toBe(false);
  });

  it('should reject empty date', () => {
    const result = expenseSchema.safeParse({ ...validData, date: '' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const dateError = result.error.issues.find((i) => i.path.includes('date'));
      expect(dateError?.message).toBe('Date is required');
    }
  });

  it('should reject invalid category', () => {
    const result = expenseSchema.safeParse({ ...validData, category: 'InvalidCategory' });
    expect(result.success).toBe(false);
    if (!result.success) {
      const catError = result.error.issues.find((i) => i.path.includes('category'));
      expect(catError?.message).toBe('Please select a category');
    }
  });

  it('should accept all valid categories', () => {
    for (const category of EXPENSE_CATEGORIES) {
      const result = expenseSchema.safeParse({ ...validData, category });
      expect(result.success).toBe(true);
    }
  });

  it('should accept decimal amounts', () => {
    const result = expenseSchema.safeParse({ ...validData, amount: 99.99 });
    expect(result.success).toBe(true);
  });

  it('should accept empty string comments', () => {
    const result = expenseSchema.safeParse({ ...validData, comments: '' });
    expect(result.success).toBe(true);
  });
});
