import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  MenuItem,
  Snackbar,
  Alert,
  TextField,
  Typography,
  Paper,
} from '@mui/material';
import {
  ExpenseFormSchema,
  ExpenseFormValues,
  EXPENSE_CATEGORIES,
} from '../../core/api/schemas';
import { useCreateExpense } from '../../hooks/expenses/useCreateExpense';

function getToday(): string {
  return new Date().toISOString().split('T')[0];
}

export function ExpenseForm() {
  const [successOpen, setSuccessOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const createExpense = useCreateExpense();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ExpenseFormValues>({
    resolver: zodResolver(ExpenseFormSchema),
    defaultValues: {
      name: '',
      amount: undefined as unknown as number,
      date: getToday(),
      category: undefined as unknown as ExpenseFormValues['category'],
      comments: '',
    },
  });

  const onSubmit = (values: ExpenseFormValues) => {
    setErrorMessage(null);
    createExpense.mutate(values, {
      onSuccess: () => {
        setSuccessOpen(true);
        reset();
      },
      onError: (error: Error) => {
        setErrorMessage(error.message || 'Failed to create expense');
      },
    });
  };

  const isLoading = createExpense.isPending || isSubmitting;

  return (
    <Paper sx={{ p: 3, maxWidth: 480, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Log Expense
      </Typography>

      <Box
        component="form"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
        sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
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

        <Button
          type="submit"
          variant="contained"
          size="large"
          disabled={isLoading}
          fullWidth
          aria-label="Submit expense"
        >
          {isLoading ? 'Saving...' : 'Save Expense'}
        </Button>
      </Box>

      <Snackbar
        open={successOpen}
        autoHideDuration={4000}
        onClose={() => setSuccessOpen(false)}
      >
        <Alert severity="success" onClose={() => setSuccessOpen(false)}>
          Expense saved successfully!
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!errorMessage}
        autoHideDuration={6000}
        onClose={() => setErrorMessage(null)}
      >
        <Alert severity="error" onClose={() => setErrorMessage(null)}>
          {errorMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
}
