import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Dashboard } from '../Dashboard';

vi.mock('../../core/hooks/useExpenses', () => ({
  useExpenses: vi.fn(),
}));

import { useExpenses } from '../../core/hooks/useExpenses';

const mockedUseExpenses = vi.mocked(useExpenses);

function renderDashboard() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Dashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('Dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state with skeleton cards', () => {
    mockedUseExpenses.mockReturnValue({
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useExpenses>);

    const { container } = renderDashboard();
    const skeletons = container.querySelectorAll('.MuiSkeleton-root');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders summary cards when data is loaded', () => {
    mockedUseExpenses.mockReturnValue({
      data: [
        { id: '1', name: 'Test', amount: 100, date: '2024-01-15', category: 'Food', type: 'Credit' },
        { id: '2', name: 'Test2', amount: 200, date: '2024-02-20', category: 'Transport', type: 'Cash' },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useExpenses>);

    renderDashboard();
    expect(screen.getByText('Number of Expenses')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('Total Expenses Amount')).toBeInTheDocument();
    expect(screen.getByText('First Expense Date')).toBeInTheDocument();
    expect(screen.getByText('Latest Expense Date')).toBeInTheDocument();
  });

  it('renders empty state when no expenses', () => {
    mockedUseExpenses.mockReturnValue({
      data: [],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useExpenses>);

    renderDashboard();
    expect(screen.getByText('No expense data found.')).toBeInTheDocument();
    expect(screen.getByText('Enter expenses to view and interact with your dashboard.')).toBeInTheDocument();
  });

  it('renders error state with retry button', () => {
    const mockRefetch = vi.fn();
    mockedUseExpenses.mockReturnValue({
      data: undefined,
      isLoading: false,
      isError: true,
      error: new Error('Network error'),
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useExpenses>);

    renderDashboard();
    expect(screen.getByText('Network error')).toBeInTheDocument();
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('renders FAB button to add expense', () => {
    mockedUseExpenses.mockReturnValue({
      data: [
        { id: '1', name: 'Test', amount: 100, date: '2024-01-15', category: 'Food', type: 'Credit' },
      ],
      isLoading: false,
      isError: false,
      error: null,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useExpenses>);

    renderDashboard();
    expect(screen.getByLabelText('Add expense')).toBeInTheDocument();
  });
});
