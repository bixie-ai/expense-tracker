import { useState, useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import TablePagination from '@mui/material/TablePagination';
import Paper from '@mui/material/Paper';
import Chip from '@mui/material/Chip';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import { ExpenseDto } from '../../core/api/schemas';

type Order = 'asc' | 'desc';
type SortableKey = 'name' | 'amount' | 'date' | 'category' | 'type';

interface TransactionListProps {
  expenses: ExpenseDto[];
  loading?: boolean;
}

function formatCurrency(amount: number | string): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' });
}

function descendingComparator(a: ExpenseDto, b: ExpenseDto, orderBy: SortableKey): number {
  const aVal = a[orderBy];
  const bVal = b[orderBy];

  if (orderBy === 'amount') {
    const aNum = typeof aVal === 'string' ? parseFloat(aVal) : (aVal as number);
    const bNum = typeof bVal === 'string' ? parseFloat(bVal) : (bVal as number);
    return bNum - aNum;
  }

  if (orderBy === 'date') {
    return new Date(bVal as string).getTime() - new Date(aVal as string).getTime();
  }

  const aStr = String(aVal).toLowerCase();
  const bStr = String(bVal).toLowerCase();
  if (bStr < aStr) return -1;
  if (bStr > aStr) return 1;
  return 0;
}

function getComparator(order: Order, orderBy: SortableKey) {
  return order === 'desc'
    ? (a: ExpenseDto, b: ExpenseDto) => descendingComparator(a, b, orderBy)
    : (a: ExpenseDto, b: ExpenseDto) => -descendingComparator(a, b, orderBy);
}

export function TransactionList({ expenses, loading }: TransactionListProps) {
  const [order, setOrder] = useState<Order>('desc');
  const [orderBy, setOrderBy] = useState<SortableKey>('date');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const sortedExpenses = useMemo(
    () => [...expenses].sort(getComparator(order, orderBy)),
    [expenses, order, orderBy],
  );

  const paginatedExpenses = useMemo(
    () => sortedExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage),
    [sortedExpenses, page, rowsPerPage],
  );

  const handleSort = (property: SortableKey) => {
    const isAsc = orderBy === property && order === 'asc';
    setOrder(isAsc ? 'desc' : 'asc');
    setOrderBy(property);
  };

  if (loading) {
    return (
      <Paper variant="outlined">
        <Box sx={{ p: 2 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} height={48} sx={{ mb: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  if (expenses.length === 0) {
    return (
      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No transactions found
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Enter expenses to see them listed here.
        </Typography>
      </Paper>
    );
  }

  const columns: { id: SortableKey; label: string }[] = [
    { id: 'name', label: 'Name' },
    { id: 'amount', label: 'Amount' },
    { id: 'date', label: 'Date' },
    { id: 'category', label: 'Category' },
    { id: 'type', label: 'Payment Type' },
  ];

  return (
    <Paper variant="outlined">
      <TableContainer>
        <Table aria-label="Transactions table">
          <TableHead>
            <TableRow>
              {columns.map((col) => (
                <TableCell key={col.id} sortDirection={orderBy === col.id ? order : false}>
                  <TableSortLabel
                    active={orderBy === col.id}
                    direction={orderBy === col.id ? order : 'asc'}
                    onClick={() => handleSort(col.id)}
                  >
                    {col.label}
                  </TableSortLabel>
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedExpenses.map((expense) => (
              <TableRow key={expense.id ?? `${expense.name}-${expense.date}`} hover>
                <TableCell>{expense.name}</TableCell>
                <TableCell>{formatCurrency(expense.amount)}</TableCell>
                <TableCell>{formatDate(expense.date)}</TableCell>
                <TableCell>
                  <Chip label={expense.category} size="small" />
                </TableCell>
                <TableCell>{expense.type}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[10, 20, 50]}
        component="div"
        count={expenses.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
      />
    </Paper>
  );
}
