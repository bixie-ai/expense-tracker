import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { BulkEditDialogData, BulkEditDialogResult } from '@/types/import';

const DEFAULT_CATEGORIES = [
  'Groceries',
  'Transportation',
  'Entertainment',
  'Dining out',
  'Unassigned',
];

const DEFAULT_TYPES = ['Credit', 'Debit', 'Cash'];

export interface BulkEditDialogProps {
  open: boolean;
  data: BulkEditDialogData;
  categories?: string[];
  paymentTypes?: string[];
  onClose: (result?: BulkEditDialogResult) => void;
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function BulkEditDialog({
  open,
  data,
  categories = DEFAULT_CATEGORIES,
  paymentTypes = DEFAULT_TYPES,
  onClose,
}: BulkEditDialogProps) {
  const [selectedValue, setSelectedValue] = useState('');
  const { title, expenses, confirmButtonText, editType } = data;

  const handleConfirm = () => {
    if (editType === 'delete') {
      onClose({ confirmed: true });
    } else {
      if (!selectedValue) return;
      const field = editType === 'category' ? 'category' : 'type';
      onClose({ editForm: { [field]: selectedValue } });
    }
  };

  const handleCancel = () => {
    onClose(undefined);
  };

  const options = editType === 'category' ? categories : paymentTypes;

  return (
    <Dialog open={open} onClose={handleCancel} maxWidth="sm" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        {editType !== 'delete' && (
          <FormControl fullWidth sx={{ mt: 1, mb: 2 }}>
            <InputLabel id="bulk-edit-select-label">
              {editType === 'category' ? 'Category' : 'Payment Type'}
            </InputLabel>
            <Select
              labelId="bulk-edit-select-label"
              value={selectedValue}
              label={editType === 'category' ? 'Category' : 'Payment Type'}
              onChange={(e) => setSelectedValue(e.target.value)}
            >
              {options.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}

        {editType === 'delete' && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Are you sure you want to delete {expenses.length} expense
            {expenses.length !== 1 ? 's' : ''}?
          </Typography>
        )}

        <TableContainer sx={{ maxHeight: 300 }}>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>{editType === 'type' ? 'Type' : 'Category'}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.name}</TableCell>
                  <TableCell>{formatCurrency(expense.amount)}</TableCell>
                  <TableCell>{formatDate(expense.date)}</TableCell>
                  <TableCell>
                    {editType === 'type' ? expense.type : expense.category}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCancel}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color={editType === 'delete' ? 'error' : 'primary'}
          disabled={editType !== 'delete' && !selectedValue}
        >
          {confirmButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
