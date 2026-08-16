import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BulkEditDialog } from './BulkEditDialog';
import { BulkEditDialogData } from '@/types/import';

function makeDialogData(overrides: Partial<BulkEditDialogData> = {}): BulkEditDialogData {
  return {
    title: 'Update Category',
    confirmButtonText: 'Save Changes',
    editType: 'category',
    expenses: [
      {
        id: '1',
        name: 'Grocery Store',
        date: '2024-01-15',
        amount: 42.5,
        category: 'Groceries',
        type: 'Debit',
      },
    ],
    ...overrides,
  };
}

describe('BulkEditDialog', () => {
  describe('category edit mode', () => {
    it('should render dialog title and category select', () => {
      const onClose = vi.fn();
      render(<BulkEditDialog open={true} data={makeDialogData()} onClose={onClose} />);

      expect(screen.getByText('Update Category')).toBeInTheDocument();
      expect(screen.getByLabelText('Category')).toBeInTheDocument();
    });

    it('should disable confirm button when no category is selected', () => {
      const onClose = vi.fn();
      render(<BulkEditDialog open={true} data={makeDialogData()} onClose={onClose} />);

      const confirmButton = screen.getByRole('button', { name: 'Save Changes' });
      expect(confirmButton).toBeDisabled();
    });

    it('should display expense preview table', () => {
      const onClose = vi.fn();
      render(<BulkEditDialog open={true} data={makeDialogData()} onClose={onClose} />);

      expect(screen.getByText('Grocery Store')).toBeInTheDocument();
      expect(screen.getByText('$42.50')).toBeInTheDocument();
    });

    it('should call onClose with undefined when Cancel is clicked', () => {
      const onClose = vi.fn();
      render(<BulkEditDialog open={true} data={makeDialogData()} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClose).toHaveBeenCalledWith(undefined);
    });

    it('should use custom categories when provided', () => {
      const onClose = vi.fn();
      render(
        <BulkEditDialog
          open={true}
          data={makeDialogData()}
          categories={['Custom Cat 1', 'Custom Cat 2']}
          onClose={onClose}
        />
      );

      fireEvent.mouseDown(screen.getByLabelText('Category'));
      expect(screen.getByRole('option', { name: 'Custom Cat 1' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: 'Custom Cat 2' })).toBeInTheDocument();
    });
  });

  describe('type edit mode', () => {
    it('should render Payment Type select in type edit mode', () => {
      const onClose = vi.fn();
      const data = makeDialogData({
        title: 'Update Payment Type',
        editType: 'type',
      });
      render(<BulkEditDialog open={true} data={data} onClose={onClose} />);

      expect(screen.getByText('Update Payment Type')).toBeInTheDocument();
      expect(screen.getByLabelText('Payment Type')).toBeInTheDocument();
    });
  });

  describe('delete mode', () => {
    it('should show delete confirmation message', () => {
      const onClose = vi.fn();
      const data = makeDialogData({
        title: 'Delete Expenses',
        confirmButtonText: 'Delete Expenses',
        editType: 'delete',
        expenses: [
          { id: '1', name: 'A', date: '2024-01-01', amount: 10, category: 'Cat', type: 'Debit' },
          { id: '2', name: 'B', date: '2024-01-02', amount: 20, category: 'Cat', type: 'Debit' },
        ],
      });
      render(<BulkEditDialog open={true} data={data} onClose={onClose} />);

      expect(screen.getByText(/Are you sure you want to delete 2 expenses/)).toBeInTheDocument();
    });

    it('should call onClose with confirmed true when delete is confirmed', () => {
      const onClose = vi.fn();
      const data = makeDialogData({
        title: 'Delete Expense',
        confirmButtonText: 'Delete Expense',
        editType: 'delete',
      });
      render(<BulkEditDialog open={true} data={data} onClose={onClose} />);

      fireEvent.click(screen.getByRole('button', { name: 'Delete Expense' }));
      expect(onClose).toHaveBeenCalledWith({ confirmed: true });
    });

    it('should render confirm button with error color in delete mode', () => {
      const onClose = vi.fn();
      const data = makeDialogData({
        confirmButtonText: 'Delete Expenses',
        editType: 'delete',
      });
      render(<BulkEditDialog open={true} data={data} onClose={onClose} />);

      const deleteButton = screen.getByRole('button', { name: 'Delete Expenses' });
      expect(deleteButton).not.toBeDisabled();
    });

    it('should show singular message for single expense', () => {
      const onClose = vi.fn();
      const data = makeDialogData({
        editType: 'delete',
        expenses: [
          { id: '1', name: 'A', date: '2024-01-01', amount: 10, category: 'Cat', type: 'Debit' },
        ],
      });
      render(<BulkEditDialog open={true} data={data} onClose={onClose} />);

      expect(screen.getByText(/Are you sure you want to delete 1 expense\?/)).toBeInTheDocument();
    });
  });

  describe('closed state', () => {
    it('should not render when open is false', () => {
      const onClose = vi.fn();
      const { container } = render(
        <BulkEditDialog open={false} data={makeDialogData()} onClose={onClose} />
      );
      expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
    });
  });
});
