import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TransactionList } from '../TransactionList';
import { ExpenseDto } from '../../../core/api/schemas';

const mockExpenses: ExpenseDto[] = [
  { id: '1', name: 'Groceries', amount: 50.00, date: '2024-01-15', category: 'Food', type: 'Credit' },
  { id: '2', name: 'Bus fare', amount: 3.50, date: '2024-01-16', category: 'Transport', type: 'Cash' },
  { id: '3', name: 'Movie tickets', amount: 25.00, date: '2024-01-17', category: 'Entertainment', type: 'Debit' },
];

describe('TransactionList', () => {
  it('renders table with expense data', () => {
    render(<TransactionList expenses={mockExpenses} />);
    expect(screen.getByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Bus fare')).toBeInTheDocument();
    expect(screen.getByText('Movie tickets')).toBeInTheDocument();
  });

  it('renders empty state when no expenses', () => {
    render(<TransactionList expenses={[]} />);
    expect(screen.getByText('No transactions found')).toBeInTheDocument();
    expect(screen.getByText('Enter expenses to see them listed here.')).toBeInTheDocument();
  });

  it('renders loading skeletons', () => {
    const { container } = render(<TransactionList expenses={[]} loading />);
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays formatted currency amounts', () => {
    render(<TransactionList expenses={mockExpenses} />);
    expect(screen.getByText('$50.00')).toBeInTheDocument();
    expect(screen.getByText('$3.50')).toBeInTheDocument();
  });

  it('displays category as chip', () => {
    render(<TransactionList expenses={mockExpenses} />);
    expect(screen.getByText('Food')).toBeInTheDocument();
    expect(screen.getByText('Transport')).toBeInTheDocument();
  });

  it('sorts by column when header clicked', async () => {
    const user = userEvent.setup();
    render(<TransactionList expenses={mockExpenses} />);

    const nameHeader = screen.getByText('Name');
    await user.click(nameHeader);

    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1);
  });

  it('renders pagination controls', () => {
    render(<TransactionList expenses={mockExpenses} />);
    expect(screen.getByText('Rows per page:')).toBeInTheDocument();
  });
});
