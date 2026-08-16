import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DeleteExpenseDialog } from '../DeleteExpenseDialog';
import { Expense } from '../../../types/expense';

const mockExpense: Expense = {
  id: 'expense-42',
  name: 'Lunch',
  amount: 15,
  date: '2024-03-15',
  category: 'Food',
  type: 'Manual',
};

describe('DeleteExpenseDialog', () => {
  const defaultProps = {
    open: true,
    expense: mockExpense,
    onClose: vi.fn(),
    onConfirm: vi.fn(),
    isDeleting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render dialog with title', () => {
    render(<DeleteExpenseDialog {...defaultProps} />);
    expect(screen.getByText('Delete Expense')).toBeInTheDocument();
  });

  it('should display confirmation message with expense name', () => {
    render(<DeleteExpenseDialog {...defaultProps} />);
    expect(
      screen.getByText(/Are you sure you want to delete "Lunch"\? This action cannot be undone\./),
    ).toBeInTheDocument();
  });

  it('should call onClose when Cancel is clicked', () => {
    render(<DeleteExpenseDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should call onConfirm with expense ID when Delete is clicked', () => {
    render(<DeleteExpenseDialog {...defaultProps} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).toHaveBeenCalledWith('expense-42');
  });

  it('should not render when open is false', () => {
    render(<DeleteExpenseDialog {...defaultProps} open={false} />);
    expect(screen.queryByText('Delete Expense')).not.toBeInTheDocument();
  });

  it('should show spinner when isDeleting is true', () => {
    render(<DeleteExpenseDialog {...defaultProps} isDeleting={true} />);
    expect(screen.getByText('Deleting...')).toBeInTheDocument();
  });

  it('should disable buttons when isDeleting is true', () => {
    render(<DeleteExpenseDialog {...defaultProps} isDeleting={true} />);
    expect(screen.getByText('Cancel')).toBeDisabled();
    expect(screen.getByText('Deleting...')).toBeDisabled();
  });

  it('should not call onConfirm when expense is null', () => {
    render(<DeleteExpenseDialog {...defaultProps} expense={null} />);
    fireEvent.click(screen.getByText('Delete'));
    expect(defaultProps.onConfirm).not.toHaveBeenCalled();
  });
});
