import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  CircularProgress,
} from '@mui/material';
import { Expense } from '../../types/expense';

export interface DeleteExpenseDialogProps {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onConfirm: (expenseId: string) => void;
  isDeleting?: boolean;
}

export function DeleteExpenseDialog({
  open,
  expense,
  onClose,
  onConfirm,
  isDeleting = false,
}: DeleteExpenseDialogProps) {
  const handleConfirm = () => {
    if (expense?.id) {
      onConfirm(expense.id);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="delete-expense-dialog-title">
      <DialogTitle id="delete-expense-dialog-title">Delete Expense</DialogTitle>
      <DialogContent>
        <DialogContentText>
          Are you sure you want to delete &quot;{expense?.name}&quot;? This action cannot be undone.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isDeleting}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          color="error"
          variant="contained"
          disabled={isDeleting}
          startIcon={isDeleting ? <CircularProgress size={16} /> : undefined}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
