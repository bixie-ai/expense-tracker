import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImportReview } from '../useImportReview';
import { Expense } from '@/types/expense';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    name: 'Test',
    date: '2024-01-15',
    amount: 42.5,
    category: 'Groceries',
    type: 'Debit',
    ...overrides,
  };
}

describe('useImportReview', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useImportReview());
    expect(result.current.debitExpenses).toEqual([]);
    expect(result.current.creditExpenses).toEqual([]);
    expect(result.current.reviewedExpenses).toEqual({ debits: [], credits: [] });
    expect(result.current.hasReviewedExpenses).toBe(false);
  });

  it('should split expenses into debits and credits when setExpenses is called', () => {
    const { result } = renderHook(() => useImportReview());

    act(() => {
      result.current.setExpenses([
        makeExpense({ amount: 100 }),
        makeExpense({ amount: -50 }),
        makeExpense({ amount: 25 }),
      ]);
    });

    expect(result.current.debitExpenses).toHaveLength(2);
    expect(result.current.creditExpenses).toHaveLength(1);
    expect(result.current.debitExpenses[0].id).toBe('1-debit');
    expect(result.current.debitExpenses[1].id).toBe('3-debit');
    expect(result.current.creditExpenses[0].id).toBe('2-credit');
  });

  it('should assign zero amounts to debits', () => {
    const { result } = renderHook(() => useImportReview());

    act(() => {
      result.current.setExpenses([makeExpense({ amount: 0 })]);
    });

    expect(result.current.debitExpenses).toHaveLength(1);
    expect(result.current.creditExpenses).toHaveLength(0);
  });

  it('should set hasReviewedExpenses to true when expenses exist', () => {
    const { result } = renderHook(() => useImportReview());

    act(() => {
      result.current.setExpenses([makeExpense({ amount: 100 })]);
    });

    expect(result.current.hasReviewedExpenses).toBe(true);
  });

  it('should update reviewed expenses for debits source', () => {
    const { result } = renderHook(() => useImportReview());

    const updatedDebits = [makeExpense({ id: '1-debit', amount: 200, category: 'Updated' })];
    act(() => {
      result.current.updateReviewedExpenses('debits', updatedDebits);
    });

    expect(result.current.reviewedExpenses.debits).toEqual(updatedDebits);
    expect(result.current.reviewedExpenses.credits).toEqual([]);
  });

  it('should update reviewed expenses for credits source', () => {
    const { result } = renderHook(() => useImportReview());

    const updatedCredits = [makeExpense({ id: '1-credit', amount: -50 })];
    act(() => {
      result.current.updateReviewedExpenses('credits', updatedCredits);
    });

    expect(result.current.reviewedExpenses.credits).toEqual(updatedCredits);
    expect(result.current.reviewedExpenses.debits).toEqual([]);
  });

  it('should populate reviewedExpenses when setExpenses is called', () => {
    const { result } = renderHook(() => useImportReview());

    act(() => {
      result.current.setExpenses([
        makeExpense({ amount: 100 }),
        makeExpense({ amount: -50 }),
      ]);
    });

    expect(result.current.reviewedExpenses.debits).toHaveLength(1);
    expect(result.current.reviewedExpenses.credits).toHaveLength(1);
  });

  it('should handle large datasets without error', () => {
    const { result } = renderHook(() => useImportReview());

    const largeDataset = Array.from({ length: 1000 }, (_, i) =>
      makeExpense({ amount: i % 2 === 0 ? i * 10 : -(i * 10) })
    );

    act(() => {
      result.current.setExpenses(largeDataset);
    });

    expect(result.current.debitExpenses).toHaveLength(500);
    expect(result.current.creditExpenses).toHaveLength(500);
    expect(result.current.hasReviewedExpenses).toBe(true);
  });

  it('should reset state when setExpenses is called with empty array', () => {
    const { result } = renderHook(() => useImportReview());

    act(() => {
      result.current.setExpenses([makeExpense({ amount: 100 })]);
    });
    expect(result.current.hasReviewedExpenses).toBe(true);

    act(() => {
      result.current.setExpenses([]);
    });
    expect(result.current.debitExpenses).toEqual([]);
    expect(result.current.creditExpenses).toEqual([]);
    expect(result.current.hasReviewedExpenses).toBe(false);
  });
});
