import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  CircularProgress,
  Box,
} from '@mui/material';
import { expenseSchema, ExpenseFormData, EXPENSE_CATEGORIES } from '../../schemas/expenseSchema';
import { PAYMENT_TYPES } from '../../core/api/schemas';
import { Expense } from '../../types/expense';

export interface EditExpenseDialogProps {
  open: boolean;
  expense: Expense | null;
  onClose: () => void;
  onSubmit: (expenseId: string, data: ExpenseFormData) => void;
  isSubmitting?: boolean;
}

export function EditExpenseDialog({
  open,
  expense,
  onClose,
  onSubmit,
  isSubmitting = false,
}: EditExpenseDialogProps) {
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ExpenseFormData>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      name: '',
      amount: 0,
      date: '',
      category: undefined as unknown as ExpenseFormData['category'],
      type: undefined as unknown as ExpenseFormData['type'],
      comments: '',
    },
  });

  useEffect(() => {
    if (expense && open) {
      reset({
        name: expense.name,
        amount: typeof expense.amount === 'string' ? parseFloat(expense.amount) : expense.amount,
        date:
          typeof expense.date === 'string'
            ? expense.date
            : expense.date.toISOString().split('T')[0],
        category: expense.category as ExpenseFormData['category'],
        type: (expense.type as ExpenseFormData['type']) ?? 'Credit',
        comments: expense.comments ?? '',
      });
    }
  }, [expense, open, reset]);

  const handleFormSubmit = (data: ExpenseFormData) => {
    if (expense?.id) {
      onSubmit(expense.id, data);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth aria-labelledby="edit-expense-dialog-title">
      <DialogTitle id="edit-expense-dialog-title">Edit Expense</DialogTitle>
      <DialogContent>
        <Box
          component="form"
          id="edit-expense-form"
          onSubmit={handleSubmit(handleFormSubmit)}
          noValidate
          sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}
        >
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? undefined : Number(val));
                }}
                value={field.value ?? ''}
                label="Amount"
                type="number"
                slotProps={{
                  htmlInput: { min: 0, step: '0.01', 'aria-label': 'Amount' },
                }}
                error={!!errors.amount}
                helperText={errors.amount?.message}
                fullWidth
                required
              />
            )}
          />

          <Controller
            name="date"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Date"
                type="date"
                slotProps={{
                  inputLabel: { shrink: true },
                  htmlInput: { 'aria-label': 'Date' },
                }}
                error={!!errors.date}
                helperText={errors.date?.message}
                fullWidth
                required
              />
            )}
          />

          <Controller
            name="category"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                select
                label="Category"
                slotProps={{
                  htmlInput: { 'aria-label': 'Category' },
                }}
                error={!!errors.category}
                helperText={errors.category?.message}
                fullWidth
                required
              >
                {EXPENSE_CATEGORIES.map((cat) => (
                  <MenuItem key={cat} value={cat}>
                    {cat}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                value={field.value ?? ''}
                select
                label="Payment Source"
                slotProps={{
                  htmlInput: { 'aria-label': 'Payment Source' },
                }}
                error={!!errors.type}
                helperText={errors.type?.message}
                fullWidth
                required
              >
                {PAYMENT_TYPES.map((t) => (
                  <MenuItem key={t} value={t}>
                    {t}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                slotProps={{
                  htmlInput: { 'aria-label': 'Description' },
                }}
                error={!!errors.name}
                helperText={errors.name?.message}
                fullWidth
                required
              />
            )}
          />

          <Controller
            name="comments"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Comments"
                slotProps={{
                  htmlInput: { 'aria-label': 'Comments' },
                }}
                multiline
                rows={3}
                fullWidth
              />
            )}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          type="submit"
          form="edit-expense-form"
          variant="contained"
          disabled={isSubmitting}
          startIcon={isSubmitting ? <CircularProgress size={16} /> : undefined}
        >
          {isSubmitting ? 'Saving...' : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
