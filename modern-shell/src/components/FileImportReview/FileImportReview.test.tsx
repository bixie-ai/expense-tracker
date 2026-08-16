import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { FileImportReview } from './FileImportReview';
import { Expense } from '@/types/expense';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: '1-debit',
    name: 'Grocery Store',
    date: '2024-01-15',
    amount: 42.5,
    category: 'Groceries',
    type: 'Debit',
    comments: '',
    ...overrides,
  };
}

describe('FileImportReview', () => {
  describe('loading state', () => {
    it('should display a loading spinner when isLoading is true', () => {
      render(<FileImportReview expenses={[]} isLoading={true} />);
      expect(screen.getByLabelText('Loading expenses')).toBeInTheDocument();
    });
  });

  describe('error state', () => {
    it('should display an error alert when error is provided', () => {
      render(<FileImportReview expenses={[]} error="Something went wrong" />);
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should display empty message when no expenses provided', () => {
      render(<FileImportReview expenses={[]} />);
      expect(
        screen.getByText('No expense data to review. Please upload and map a CSV file first.')
      ).toBeInTheDocument();
    });
  });

  describe('tabs rendering', () => {
    it('should render Expenses and Credits tabs', () => {
      const expenses = [makeExpense({ amount: 100 }), makeExpense({ amount: -50, id: '2-credit' })];
      render(<FileImportReview expenses={expenses} />);
      expect(screen.getByRole('tab', { name: 'Expenses' })).toBeInTheDocument();
      expect(screen.getByRole('tab', { name: 'Credits' })).toBeInTheDocument();
    });

    it('should show debit expenses on the Expenses tab by default', () => {
      const expenses = [makeExpense({ name: 'Debit Item', amount: 100 })];
      render(<FileImportReview expenses={expenses} />);
      expect(screen.getByText('Debit Item')).toBeInTheDocument();
    });

    it('should show credits when Credits tab is clicked', () => {
      const expenses = [
        makeExpense({ name: 'Debit Item', amount: 100 }),
        makeExpense({ name: 'Credit Item', amount: -25, id: '2-credit' }),
      ];
      render(<FileImportReview expenses={expenses} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
      expect(screen.getByText('Credit Item')).toBeInTheDocument();
    });

    it('should show "No credits to display" when there are no credits', () => {
      const expenses = [makeExpense({ amount: 100 })];
      render(<FileImportReview expenses={expenses} />);

      fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
      expect(screen.getByText('No credits to display.')).toBeInTheDocument();
    });

    it('should show "No expenses to display" when there are only credits', () => {
      const expenses = [makeExpense({ amount: -50 })];
      render(<FileImportReview expenses={expenses} />);
      expect(screen.getByText('No expenses to display.')).toBeInTheDocument();
    });
  });

  describe('filtering by source', () => {
    it('should correctly split expenses into debits and credits based on amount sign', () => {
      const expenses = [
        makeExpense({ name: 'Positive One', amount: 10, id: '1' }),
        makeExpense({ name: 'Negative One', amount: -20, id: '2' }),
        makeExpense({ name: 'Zero Amount', amount: 0, id: '3' }),
        makeExpense({ name: 'Positive Two', amount: 55.5, id: '4' }),
      ];
      render(<FileImportReview expenses={expenses} />);

      // Debits tab (default) should show positive + zero
      expect(screen.getByText('Positive One')).toBeInTheDocument();
      expect(screen.getByText('Zero Amount')).toBeInTheDocument();
      expect(screen.getByText('Positive Two')).toBeInTheDocument();
      expect(screen.queryByText('Negative One')).not.toBeInTheDocument();

      // Credits tab should show negatives
      fireEvent.click(screen.getByRole('tab', { name: 'Credits' }));
      expect(screen.getByText('Negative One')).toBeInTheDocument();
      expect(screen.queryByText('Positive One')).not.toBeInTheDocument();
    });
  });

  describe('reviewedExpensesChange callback', () => {
    it('should call onReviewedExpensesChange when expenses are modified', () => {
      const onChange = vi.fn();
      const expenses = [
        makeExpense({ name: 'Item A', amount: 100, id: '1' }),
        makeExpense({ name: 'Item B', amount: 200, id: '2' }),
      ];
      render(<FileImportReview expenses={expenses} onReviewedExpensesChange={onChange} />);

      // Select an item and delete it to trigger a change
      const checkbox = screen.getByRole('checkbox', { name: 'Select Item A' });
      fireEvent.click(checkbox);

      const deleteButton = screen.getByRole('button', { name: 'Delete Item A' });
      fireEvent.click(deleteButton);

      // Confirm deletion in the dialog
      const confirmButton = screen.getByRole('button', { name: 'Delete Expense' });
      fireEvent.click(confirmButton);

      expect(onChange).toHaveBeenCalled();
    });
  });

  describe('data validation', () => {
    it('should handle expenses with string amounts by displaying them correctly', () => {
      const expenses = [makeExpense({ name: 'String Amount', amount: '42.50' as unknown as number })];
      render(<FileImportReview expenses={expenses} />);
      expect(screen.getByText('String Amount')).toBeInTheDocument();
    });

    it('should handle expenses with Date objects', () => {
      const expenses = [makeExpense({ name: 'Date Object', date: new Date('2024-03-15') })];
      render(<FileImportReview expenses={expenses} />);
      expect(screen.getByText('Date Object')).toBeInTheDocument();
    });
  });
});
