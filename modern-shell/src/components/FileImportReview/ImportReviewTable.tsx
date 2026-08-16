import { useState, useMemo, useCallback, ChangeEvent } from 'react';
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TablePagination,
  Checkbox,
  IconButton,
  Button,
  Menu,
  MenuItem,
  Typography,
  Snackbar,
} from '@mui/material';
import EditNoteIcon from '@mui/icons-material/EditNote';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { Expense } from '@/types/expense';
import { BulkEditDialogData, BulkEditDialogResult, BulkEditType } from '@/types/import';
import { BulkEditDialog } from './BulkEditDialog';

type Order = 'asc' | 'desc';
type SortableKey = 'date' | 'name' | 'amount' | 'category' | 'type';

export interface ImportReviewTableProps {
  expenses: Expense[];
  onExpensesChange: (expenses: Expense[]) => void;
  categories?: string[];
  paymentTypes?: string[];
}

function descendingComparator(a: Expense, b: Expense, orderBy: SortableKey): number {
  const aVal = a[orderBy];
  const bVal = b[orderBy];
  if (orderBy === 'amount') {
    const aNum = typeof aVal === 'string' ? parseFloat(aVal) : (aVal as number);
    const bNum = typeof bVal === 'string' ? parseFloat(bVal) : (bVal as number);
    return bNum - aNum;
  }
  if (orderBy === 'date') {
    const aDate = new Date(aVal as string | Date).getTime();
    const bDate = new Date(bVal as string | Date).getTime();
    return bDate - aDate;
  }
  const aStr = String(aVal ?? '').toLowerCase();
  const bStr = String(bVal ?? '').toLowerCase();
  if (bStr < aStr) return -1;
  if (bStr > aStr) return 1;
  return 0;
}

function getComparator(order: Order, orderBy: SortableKey) {
  return order === 'desc'
    ? (a: Expense, b: Expense) => descendingComparator(a, b, orderBy)
    : (a: Expense, b: Expense) => -descendingComparator(a, b, orderBy);
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString();
}

export function ImportReviewTable({
  expenses,
  onExpensesChange,
  categories,
  paymentTypes,
}: ImportReviewTableProps) {
  const [order, setOrder] = useState<Order>('asc');
  const [orderBy, setOrderBy] = useState<SortableKey>('date');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);
  const [snackMessage, setSnackMessage] = useState<string | null>(null);
  const [dialogData, setDialogData] = useState<BulkEditDialogData | null>(null);
  const [pendingEditType, setPendingEditType] = useState<BulkEditType | null>(null);
  const [pendingSingleDelete, setPendingSingleDelete] = useState<Expense | null>(null);

  const sortedExpenses = useMemo(
    () => [...expenses].sort(getComparator(order, orderBy)),
    [expenses, order, orderBy]
  );

  const paginatedExpenses = useMemo(
    () => sortedExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedExpenses, page, rowsPerPage]
  );

  const handleSort = (property: SortableKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  const handleSelectAll = () => {
    if (selected.size === expenses.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(expenses.map((e) => e.id!)));
    }
  };

  const handleSelectRow = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handlePageChange = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleRowsPerPageChange = (e: ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(e.target.value, 10));
    setPage(0);
  };

  const selectedExpenses = useMemo(
    () => expenses.filter((e) => selected.has(e.id!)),
    [expenses, selected]
  );

  const openBulkEdit = useCallback(
    (editType: BulkEditType) => {
      setMenuAnchor(null);
      const title =
        editType === 'category'
          ? 'Update Category'
          : editType === 'type'
            ? 'Update Payment Type'
            : 'Delete Expenses';
      const confirmButtonText = editType === 'delete' ? 'Delete Expenses' : 'Save Changes';
      setPendingEditType(editType);
      setPendingSingleDelete(null);
      setDialogData({ title, confirmButtonText, editType, expenses: selectedExpenses });
    },
    [selectedExpenses]
  );

  const handleDeleteRow = useCallback((expense: Expense) => {
    setPendingEditType('delete');
    setPendingSingleDelete(expense);
    setDialogData({
      title: 'Delete Expense',
      confirmButtonText: 'Delete Expense',
      editType: 'delete',
      expenses: [expense],
    });
  }, []);

  const handleEditRow = useCallback(
    (expense: Expense) => {
      setPendingEditType('category');
      setPendingSingleDelete(null);
      setDialogData({
        title: 'Edit Expense Category',
        confirmButtonText: 'Save Changes',
        editType: 'category',
        expenses: [expense],
      });
    },
    []
  );

  const handleDialogClose = useCallback(
    (result?: BulkEditDialogResult) => {
      if (!result) {
        setDialogData(null);
        setPendingEditType(null);
        setPendingSingleDelete(null);
        return;
      }

      if (pendingEditType === 'delete') {
        if (result.confirmed) {
          if (pendingSingleDelete) {
            const updated = expenses.filter((e) => e.id !== pendingSingleDelete.id);
            onExpensesChange(updated);
            setSnackMessage('Expense successfully deleted.');
          } else {
            const idsToDelete = new Set(selectedExpenses.map((e) => e.id));
            const updated = expenses.filter((e) => !idsToDelete.has(e.id));
            onExpensesChange(updated);
            setSelected(new Set());
            setSnackMessage('Expenses successfully deleted.');
          }
        }
      } else if (result.editForm) {
        if (pendingSingleDelete === null && selectedExpenses.length > 0) {
          const selectedIds = new Set(selectedExpenses.map((e) => e.id));
          const updated = expenses.map((e) =>
            selectedIds.has(e.id) ? { ...e, ...result.editForm } : e
          );
          onExpensesChange(updated);
          setSelected(new Set());
          setSnackMessage('Expenses successfully updated.');
        } else if (dialogData && dialogData.expenses.length === 1) {
          const targetId = dialogData.expenses[0].id;
          const updated = expenses.map((e) =>
            e.id === targetId ? { ...e, ...result.editForm } : e
          );
          onExpensesChange(updated);
          setSnackMessage('Expense successfully updated.');
        }
      }

      setDialogData(null);
      setPendingEditType(null);
      setPendingSingleDelete(null);
    },
    [expenses, onExpensesChange, pendingEditType, pendingSingleDelete, selectedExpenses, dialogData]
  );

  const isAllSelected = expenses.length > 0 && selected.size === expenses.length;
  const isIndeterminate = selected.size > 0 && selected.size < expenses.length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', px: 2, py: 1, gap: 1 }}>
        <Typography variant="body2" sx={{ borderRight: 1, borderColor: 'divider', pr: 1 }}>
          {selected.size} selected
        </Typography>
        <Button
          size="small"
          disabled={selected.size === 0}
          onClick={(e) => setMenuAnchor(e.currentTarget)}
          endIcon={<EditNoteIcon />}
        >
          Modify
        </Button>
        <Menu
          anchorEl={menuAnchor}
          open={Boolean(menuAnchor)}
          onClose={() => setMenuAnchor(null)}
        >
          <MenuItem onClick={() => openBulkEdit('category')}>Edit Category</MenuItem>
          <MenuItem onClick={() => openBulkEdit('type')}>Edit Type</MenuItem>
          <MenuItem onClick={() => openBulkEdit('delete')}>Delete</MenuItem>
        </Menu>
      </Box>

      <TableContainer sx={{ maxHeight: 600 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={isIndeterminate}
                  checked={isAllSelected}
                  onChange={handleSelectAll}
                  slotProps={{ input: { 'aria-label': 'Select all expenses' } }}
                />
              </TableCell>
              {(['date', 'name', 'amount', 'category', 'type'] as SortableKey[]).map((col) => (
                <TableCell key={col}>
                  <TableSortLabel
                    active={orderBy === col}
                    direction={orderBy === col ? order : 'asc'}
                    onClick={() => handleSort(col)}
                  >
                    {col.charAt(0).toUpperCase() + col.slice(1)}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell>Comments</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedExpenses.map((expense) => (
              <TableRow
                key={expense.id}
                selected={selected.has(expense.id!)}
                hover
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selected.has(expense.id!)}
                    onChange={() => handleSelectRow(expense.id!)}
                    slotProps={{ input: { 'aria-label': `Select ${expense.name}` } }}
                  />
                </TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>{expense.name}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>{expense.type}</TableCell>
                <TableCell>{expense.comments ?? ''}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex' }}>
                    <IconButton
                      size="small"
                      color="primary"
                      onClick={() => handleEditRow(expense)}
                      aria-label={`Edit ${expense.name}`}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => handleDeleteRow(expense)}
                      aria-label={`Delete ${expense.name}`}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
              </TableRow>
            ))}
            {paginatedExpenses.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography variant="body2" color="text.secondary" sx={{ py: 3 }}>
                    No expenses to display.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={expenses.length}
        page={page}
        onPageChange={handlePageChange}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[10, 25, 50, 100]}
      />

      {dialogData && (
        <BulkEditDialog
          open={true}
          data={dialogData}
          categories={categories}
          paymentTypes={paymentTypes}
          onClose={handleDialogClose}
        />
      )}

      <Snackbar
        open={snackMessage !== null}
        autoHideDuration={3000}
        onClose={() => setSnackMessage(null)}
        message={snackMessage}
      />
    </Box>
  );
}
