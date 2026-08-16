import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseFilterControls } from './ExpenseFilterControls';
import { useExpenseFilters } from '../../hooks/filters/useExpenseFilters';

const mockUserId = 'test-user-123';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mockUserId } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

function TestHost({ hasExpenses = true, hasImportedFiles = false }) {
  const filters = useExpenseFilters();
  return (
    <ExpenseFilterControls
      filters={filters}
      hasExpenses={hasExpenses}
      hasImportedFiles={hasImportedFiles}
    />
  );
}

describe('ExpenseFilterControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render nothing when there are no expenses', () => {
    const { container } = render(<TestHost hasExpenses={false} />, { wrapper: createWrapper() });
    expect(container.firstChild).toBeNull();
  });

  it('should render the toggle filters chip when expenses exist', () => {
    render(<TestHost />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Toggle filters')).toBeInTheDocument();
  });

  it('should show filter panel when toggle chip is clicked', () => {
    render(<TestHost />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));
    expect(screen.getByText('Time Frame')).toBeInTheDocument();
  });

  it('should render all time frame chips when filters are visible', () => {
    render(<TestHost />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    expect(screen.getByText('Current Month')).toBeInTheDocument();
    expect(screen.getByText('Last 3 Months')).toBeInTheDocument();
    expect(screen.getByText('Last 6 Months')).toBeInTheDocument();
    expect(screen.getByText('Custom Date Range')).toBeInTheDocument();
  });

  it('should highlight selected time frame chip with primary color', () => {
    render(<TestHost />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));
    fireEvent.click(screen.getByText('Current Month'));

    const chip = screen.getByText('Current Month').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorPrimary');
  });

  it('should deselect time frame chip when clicking the same chip again', () => {
    render(<TestHost />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    fireEvent.click(screen.getByText('Current Month'));
    let chip = screen.getByText('Current Month').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorPrimary');

    fireEvent.click(screen.getByText('Current Month'));
    chip = screen.getByText('Current Month').closest('.MuiChip-root');
    expect(chip).not.toHaveClass('MuiChip-colorPrimary');
  });

  it('should show custom date picker only when Custom Date Range is selected', () => {
    render(<TestHost />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument();

    fireEvent.click(screen.getByText('Custom Date Range'));
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();
    expect(screen.getByLabelText('End Date')).toBeInTheDocument();
  });

  it('should hide custom date picker when selecting a preset time frame', async () => {
    render(<TestHost />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    fireEvent.click(screen.getByText('Custom Date Range'));
    expect(screen.getByLabelText('Start Date')).toBeInTheDocument();

    fireEvent.click(screen.getByText('Last 3 Months'));

    await waitFor(() => {
      expect(screen.queryByLabelText('Start Date')).not.toBeInTheDocument();
    });
  });

  it('should not show entry type filters when no imported files exist', () => {
    render(<TestHost hasImportedFiles={false} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    expect(screen.queryByText('Expense Entry Type')).not.toBeInTheDocument();
  });

  it('should show entry type filters when imported files exist', () => {
    render(<TestHost hasImportedFiles={true} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    expect(screen.getByText('Expense Entry Type')).toBeInTheDocument();
    expect(screen.getByText('Manual Entry')).toBeInTheDocument();
    expect(screen.getByText('Imported')).toBeInTheDocument();
  });

  it('should highlight selected entry type chip', () => {
    render(<TestHost hasImportedFiles={true} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));
    fireEvent.click(screen.getByText('Imported'));

    const chip = screen.getByText('Imported').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorPrimary');
  });

  it('should deselect entry type chip when clicking same chip again', () => {
    render(<TestHost hasImportedFiles={true} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    fireEvent.click(screen.getByText('Manual Entry'));
    let chip = screen.getByText('Manual Entry').closest('.MuiChip-root');
    expect(chip).toHaveClass('MuiChip-colorPrimary');

    fireEvent.click(screen.getByText('Manual Entry'));
    chip = screen.getByText('Manual Entry').closest('.MuiChip-root');
    expect(chip).not.toHaveClass('MuiChip-colorPrimary');
  });

  it('should have aria-pressed attributes on chips for accessibility', () => {
    render(<TestHost />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    const chip = screen.getByText('Current Month').closest('.MuiChip-root');
    expect(chip).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByText('Current Month'));
    expect(chip).toHaveAttribute('aria-pressed', 'true');
  });

  it('should have role=group on filter sections for accessibility', () => {
    render(<TestHost hasImportedFiles={true} />, { wrapper: createWrapper() });
    fireEvent.click(screen.getByLabelText('Toggle filters'));

    expect(screen.getByRole('group', { name: 'Time frame filters' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Entry type filters' })).toBeInTheDocument();
  });
});
