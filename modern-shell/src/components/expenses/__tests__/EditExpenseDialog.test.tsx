import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditExpenseDialog } from '../EditExpenseDialog';
import { Expense } from '../../../types/expense';

const mockExpense: Expense = {
  id: 'expense-1',
  name: 'Coffee',
  amount: 5.5,
  date: '2024-03-15',
  category: 'Food',
  type: 'Manual',
  comments: 'Morning coffee',
};

describe('EditExpenseDialog', () => {
  const defaultProps = {
    open: true,
    expense: mockExpense,
    onClose: vi.fn(),
    onSubmit: vi.fn(),
    isSubmitting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with title', () => {
    render(<EditExpenseDialog {...defaultProps} />);
    expect(screen.getByText('Edit Expense')).toBeInTheDocument();
  });

  it('should pre-populate form with expense data', () => {
    render(<EditExpenseDialog {...defaultProps} />);

    expect(screen.getByLabelText('Amount')).toHaveValue(5.5);
    expect(screen.getByLabelText('Date')).toHaveValue('2024-03-15');
    expect(screen.getByLabelText('Description')).toHaveValue('Coffee');
    expect(screen.getByLabelText('Comments')).toHaveValue('Morning coffee');
  });

  it('should call onClose when Cancel is clicked', () => {
    render(<EditExpenseDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should not render when open is false', () => {
    render(<EditExpenseDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Edit Expense')).not.toBeInTheDocument();
  });

  it('should show validation error for negative amount', async () => {
    render(<EditExpenseDialog {...defaultProps} />);

    const amountField = screen.getByLabelText('Amount');
    fireEvent.change(amountField, { target: { value: '-5' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
    });

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should show validation error for empty description', async () => {
    render(<EditExpenseDialog {...defaultProps} />);

    const descField = screen.getByLabelText('Description');
    fireEvent.change(descField, { target: { value: '' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.getByText('Description is required')).toBeInTheDocument();
    });

    expect(defaultProps.onSubmit).not.toHaveBeenCalled();
  });

  it('should call onSubmit with expense ID and form data on valid submit', async () => {
    render(<EditExpenseDialog {...defaultProps} />);

    const descField = screen.getByLabelText('Description');
    fireEvent.change(descField, { target: { value: 'Updated Coffee' } });

    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(defaultProps.onSubmit).toHaveBeenCalledWith('expense-1', {
        name: 'Updated Coffee',
        amount: 5.5,
        date: '2024-03-15',
        category: 'Food',
        comments: 'Morning coffee',
      });
    });
  });

  it('should show spinner when isSubmitting is true', () => {
    render(<EditExpenseDialog {...defaultProps} isSubmitting={true} />);
    expect(screen.getByText('Saving...')).toBeInTheDocument();
  });

  it('should disable buttons when isSubmitting is true', () => {
    render(<EditExpenseDialog {...defaultProps} isSubmitting={true} />);
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Saving...')).toBeDisabled();
  });

  it('should handle expense with string amount', () => {
    const expenseWithStringAmount: Expense = {
      ...mockExpense,
      amount: '12.99',
    };
    render(<EditExpenseDialog {...defaultProps} expense={expenseWithStringAmount} />);
    expect(screen.getByLabelText('Amount')).toHaveValue(12.99);
  });
});
