import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardHeader from '@mui/material/CardHeader';
import Fab from '@mui/material/Fab';
import Icon from '@mui/material/Icon';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import { SummaryCard, TransactionList } from '../components/dashboard';
import { useExpenses } from '../core/hooks/useExpenses';
import { ExpenseDto } from '../core/api/schemas';

interface ExpenseMetric {
  title: string;
  value: string | number;
  icon: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}

function computeMetrics(expenses: ExpenseDto[]): ExpenseMetric[] {
  if (expenses.length === 0) return [];

  const dates = expenses.map((e) => new Date(e.date));
  const firstDate = dates.reduce((min, d) => (d < min ? d : min), dates[0]);
  const lastDate = dates.reduce((max, d) => (d > max ? d : max), dates[0]);
  const total = expenses.reduce((sum, e) => {
    const amt = typeof e.amount === 'string' ? parseFloat(e.amount) : e.amount;
    return sum + amt;
  }, 0);

  return [
    { title: 'First Expense Date', value: firstDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: 'today' },
    { title: 'Latest Expense Date', value: lastDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), icon: 'today' },
    { title: 'Number of Expenses', value: expenses.length, icon: 'receipt' },
    { title: 'Total Expenses Amount', value: formatCurrency(total), icon: 'payments' },
  ];
}

export function Dashboard() {
  const { data: expenses, isLoading, isError, error, refetch } = useExpenses();
  const navigate = useNavigate();

  const metrics = useMemo(() => computeMetrics(expenses ?? []), [expenses]);

  if (isError) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => refetch()}>
              Retry
            </Button>
          }
        >
          {error instanceof Error ? error.message : 'Failed to load expenses'}
        </Alert>
      </Box>
    );
  }

  const hasData = !isLoading && expenses && expenses.length > 0;
  const isEmpty = !isLoading && expenses && expenses.length === 0;

  return (
    <Box sx={{ position: 'relative', pb: 8 }}>
      {isLoading && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={i}>
              <SummaryCard title="" value="" loading />
            </Grid>
          ))}
        </Grid>
      )}

      {hasData && (
        <>
          <Grid container spacing={3} sx={{ mb: 3 }}>
            {metrics.map((metric) => (
              <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={metric.title}>
                <SummaryCard title={metric.title} value={metric.value} icon={metric.icon} />
              </Grid>
            ))}
          </Grid>

          <Card variant="outlined">
            <CardHeader title="Detailed Summary" />
            <CardContent sx={{ px: 0 }}>
              <TransactionList expenses={expenses} />
            </CardContent>
          </Card>
        </>
      )}

      {isEmpty && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Icon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }}>assessment</Icon>
          <Typography variant="h5" sx={{ fontWeight: 300 }} gutterBottom>
            No expense data found.
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Enter expenses to view and interact with your dashboard.
          </Typography>
        </Box>
      )}

      <Fab
        variant="extended"
        color="primary"
        onClick={() => navigate('/new-expense')}
        sx={{ position: 'fixed', bottom: 24, right: 24 }}
        aria-label="Add expense"
      >
        <Icon sx={{ mr: 1 }}>post_add</Icon>
        Add Expense
      </Fab>
    </Box>
  );
}
