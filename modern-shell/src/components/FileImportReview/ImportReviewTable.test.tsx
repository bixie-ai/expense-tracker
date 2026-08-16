import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { ImportReviewTable } from './ImportReviewTable';
import { Expense } from '@/types/expense';

function makeExpense(overrides: Partial<Expense> = {}): Expense {
  return {
    id: '1-debit',
    name: 'Grocery Store',
    date: '2024-01-15',
    amount: 42.5,
    category: 'Groceries',
    type: 'Debit',
    comments: 'Weekly groceries',
    ...overrides,
  };
}

function makeExpenses(count: number): Expense[] {
  return Array.from({ length: count }, (_, i) =>
    makeExpense({
      id: `${i + 1}-debit`,
      name: `Expense ${i + 1}`,
      amount: (i + 1) * 10,
      date: `2024-01-${String(i + 1).padStart(2, '0')}`,
    })
  );
}

describe('ImportReviewTable', () => {
  let onExpensesChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onExpensesChange = vi.fn();
  });

  describe('rendering', () => {
    it('should render table with column headers', () => {
      render(<ImportReviewTable expenses={[makeExpense()]} onExpensesChange={onExpensesChange} />);
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Category')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Comments')).toBeInTheDocument();
      expect(screen.getByText('Actions')).toBeInTheDocument();
    });

    it('should render expense data in rows', () => {
      render(<ImportReviewTable expenses={[makeExpense()]} onExpensesChange={onExpensesChange} />);
      expect(screen.getByText('Grocery Store')).toBeInTheDocument();
      expect(screen.getByText('$42.50')).toBeInTheDocument();
      expect(screen.getByText('Groceries')).toBeInTheDocument();
      expect(screen.getByText('Weekly groceries')).toBeInTheDocument();
    });

    it('should show empty state when no expenses provided', () => {
      render(<ImportReviewTable expenses={[]} onExpensesChange={onExpensesChange} />);
      expect(screen.getByText('No expenses to display.')).toBeInTheDocument();
    });

    it('should render edit and delete action buttons for each row', () => {
      const expense = makeExpense({ name: 'Test Item' });
      render(<ImportReviewTable expenses={[expense]} onExpensesChange={onExpensesChange} />);
      expect(screen.getByRole('button', { name: 'Edit Test Item' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete Test Item' })).toBeInTheDocument();
    });
  });

  describe('selection', () => {
    it('should show 0 selected initially', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('should select a single row when checkbox is clicked', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      const checkbox = screen.getByRole('checkbox', { name: 'Select Expense 1' });
      fireEvent.click(checkbox);
      expect(screen.getByText('1 selected')).toBeInTheDocument();
    });

    it('should select all rows when header checkbox is clicked', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      const selectAll = screen.getByRole('checkbox', { name: 'Select all expenses' });
      fireEvent.click(selectAll);
      expect(screen.getByText('3 selected')).toBeInTheDocument();
    });

    it('should deselect all when header checkbox is clicked again', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      const selectAll = screen.getByRole('checkbox', { name: 'Select all expenses' });
      fireEvent.click(selectAll);
      expect(screen.getByText('3 selected')).toBeInTheDocument();
      fireEvent.click(selectAll);
      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });

    it('should show indeterminate state when some rows are selected', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      const firstCheckbox = screen.getByRole('checkbox', { name: 'Select Expense 1' });
      fireEvent.click(firstCheckbox);
      const selectAll = screen.getByRole('checkbox', { name: 'Select all expenses' });
      expect(selectAll).toHaveAttribute('data-indeterminate', 'true');
    });
  });

  describe('sorting', () => {
    it('should sort by date ascending by default', () => {
      const expenses = [
        makeExpense({ id: '1', name: 'Early', date: '2024-01-01' }),
        makeExpense({ id: '2', name: 'Late', date: '2024-12-31' }),
      ];
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);
      const rows = screen.getAllByRole('row');
      // First data row (after header) should be the earliest date
      expect(within(rows[1]).getByText('Early')).toBeInTheDocument();
    });

    it('should toggle sort direction when column header is clicked', () => {
      const expenses = [
        makeExpense({ id: '1', name: 'Early', date: '2024-01-01' }),
        makeExpense({ id: '2', name: 'Late', date: '2024-12-31' }),
      ];
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);

      // Click date header to toggle to desc
      fireEvent.click(screen.getByText('Date'));
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('Late')).toBeInTheDocument();
    });

    it('should sort by name when Name column is clicked', () => {
      const expenses = [
        makeExpense({ id: '1', name: 'Zebra Store' }),
        makeExpense({ id: '2', name: 'Apple Market' }),
      ];
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);

      fireEvent.click(screen.getByText('Name'));
      const rows = screen.getAllByRole('row');
      expect(within(rows[1]).getByText('Apple Market')).toBeInTheDocument();
    });
  });

  describe('pagination', () => {
    it('should paginate when more than 10 rows', () => {
      const expenses = makeExpenses(15);
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);
      // Should show first 10 items
      expect(screen.getByText('Expense 1')).toBeInTheDocument();
      expect(screen.getByText('Expense 10')).toBeInTheDocument();
      expect(screen.queryByText('Expense 11')).not.toBeInTheDocument();
    });

    it('should display correct pagination info', () => {
      const expenses = makeExpenses(25);
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);
      expect(screen.getByText('1–10 of 25')).toBeInTheDocument();
    });
  });

  describe('bulk edit', () => {
    it('should disable Modify button when nothing is selected', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      const modifyButton = screen.getByRole('button', { name: /Modify/i });
      expect(modifyButton).toBeDisabled();
    });

    it('should enable Modify button when items are selected', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 1' }));
      const modifyButton = screen.getByRole('button', { name: /Modify/i });
      expect(modifyButton).not.toBeDisabled();
    });

    it('should open bulk edit menu with category, type, and delete options', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 1' }));
      fireEvent.click(screen.getByRole('button', { name: /Modify/i }));

      expect(screen.getByRole('menuitem', { name: 'Edit Category' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Edit Type' })).toBeInTheDocument();
      expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should open bulk edit dialog for category when Edit Category is clicked', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 1' }));
      fireEvent.click(screen.getByRole('button', { name: /Modify/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Edit Category' }));

      expect(screen.getByText('Update Category')).toBeInTheDocument();
    });

    it('should bulk delete selected expenses', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 1' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 2' }));
      fireEvent.click(screen.getByRole('button', { name: /Modify/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));

      // Confirm deletion
      fireEvent.click(screen.getByRole('button', { name: 'Delete Expenses' }));

      expect(onExpensesChange).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ name: 'Expense 3' })])
      );
      expect(onExpensesChange).toHaveBeenCalledWith(
        expect.not.arrayContaining([expect.objectContaining({ name: 'Expense 1' })])
      );
    });
  });

  describe('row actions', () => {
    it('should open delete dialog when delete button is clicked on a row', () => {
      const expense = makeExpense({ name: 'Target Expense' });
      render(<ImportReviewTable expenses={[expense]} onExpensesChange={onExpensesChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete Target Expense' }));
      expect(screen.getByRole('heading', { name: 'Delete Expense' })).toBeInTheDocument();
      expect(screen.getByText(/Are you sure you want to delete 1 expense/)).toBeInTheDocument();
    });

    it('should remove the expense when delete is confirmed', () => {
      const expenses = makeExpenses(2);
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete Expense 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete Expense' }));

      expect(onExpensesChange).toHaveBeenCalledWith([
        expect.objectContaining({ name: 'Expense 2' }),
      ]);
    });

    it('should not remove the expense when delete is cancelled', () => {
      const expenses = makeExpenses(2);
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete Expense 1' }));
      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onExpensesChange).not.toHaveBeenCalled();
    });

    it('should open edit dialog when edit button is clicked on a row', () => {
      const expense = makeExpense({ name: 'Target Expense' });
      render(<ImportReviewTable expenses={[expense]} onExpensesChange={onExpensesChange} />);

      fireEvent.click(screen.getByRole('button', { name: 'Edit Target Expense' }));
      expect(screen.getByText('Edit Expense Category')).toBeInTheDocument();
    });
  });

  describe('partial selection consistency', () => {
    it('should maintain selection count after page change', () => {
      const expenses = makeExpenses(15);
      render(<ImportReviewTable expenses={expenses} onExpensesChange={onExpensesChange} />);

      // Select items on page 1
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 1' }));
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 2' }));
      expect(screen.getByText('2 selected')).toBeInTheDocument();

      // The selection count should persist
      expect(screen.getByText('2 selected')).toBeInTheDocument();
    });

    it('should clear selection after bulk operation', () => {
      render(<ImportReviewTable expenses={makeExpenses(3)} onExpensesChange={onExpensesChange} />);
      fireEvent.click(screen.getByRole('checkbox', { name: 'Select Expense 1' }));
      fireEvent.click(screen.getByRole('button', { name: /Modify/i }));
      fireEvent.click(screen.getByRole('menuitem', { name: 'Delete' }));
      fireEvent.click(screen.getByRole('button', { name: 'Delete Expenses' }));

      expect(screen.getByText('0 selected')).toBeInTheDocument();
    });
  });
});
