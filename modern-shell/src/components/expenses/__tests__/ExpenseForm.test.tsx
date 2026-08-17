import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseForm } from '../ExpenseForm';

const mockMutate = vi.fn();
const mockUserId = 'test-user-123';

vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: mockUserId } }),
}));

vi.mock('../../../hooks/expenses/useCreateExpense', () => ({
  useCreateExpense: () => ({
    mutate: mockMutate,
    isPending: false,
  }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

describe('ExpenseForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render all form fields', () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });

    expect(screen.getByLabelText('Amount')).toBeInTheDocument();
    expect(screen.getByLabelText('Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('Payment Source')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Comments')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Submit expense' })).toBeInTheDocument();
  });

  it('should display the form title', () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: 'Log Expense' })).toBeInTheDocument();
  });

  it('should show validation errors when submitting empty form', async () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });

    const amountField = screen.getByLabelText('Amount');
    fireEvent.change(amountField, { target: { value: '' } });

    const dateField = screen.getByLabelText('Date');
    fireEvent.change(dateField, { target: { value: '' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit expense' }));

    await waitFor(() => {
      expect(screen.getByText('Name is required (minimum 4 characters)')).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should show error when amount is negative', async () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });

    const amountField = screen.getByLabelText('Amount');
    fireEvent.change(amountField, { target: { value: '-5' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit expense' }));

    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should show error when amount is zero', async () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });

    const amountField = screen.getByLabelText('Amount');
    fireEvent.change(amountField, { target: { value: '0' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit expense' }));

    await waitFor(() => {
      expect(screen.getByText('Amount must be greater than zero')).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should show error when category is not selected', async () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test expense' } });

    fireEvent.click(screen.getByRole('button', { name: 'Submit expense' }));

    await waitFor(() => {
      expect(screen.getByText('Please select a category')).toBeInTheDocument();
    });

    expect(mockMutate).not.toHaveBeenCalled();
  });

  it('should call mutate with form values when form is valid', async () => {
    mockMutate.mockImplementation((_values, options) => {
      options?.onSuccess?.();
    });

    render(<ExpenseForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '25.50' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Weekly groceries' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-03-15' } });

    // Select category via the MUI select
    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    const groceriesOption = await screen.findByRole('option', { name: 'Groceries' });
    fireEvent.click(groceriesOption);

    // Select payment type
    const paymentSelect = screen.getByLabelText('Payment Source');
    fireEvent.mouseDown(paymentSelect);
    const creditOption = await screen.findByRole('option', { name: 'Credit' });
    fireEvent.click(creditOption);

    fireEvent.click(screen.getByRole('button', { name: 'Submit expense' }));

    await waitFor(() => {
      expect(mockMutate).toHaveBeenCalledWith(
        {
          name: 'Weekly groceries',
          amount: 25.5,
          date: '2024-03-15',
          category: 'Groceries',
          type: 'Credit',
          comments: '',
        },
        expect.objectContaining({
          onSuccess: expect.any(Function),
          onError: expect.any(Function),
        }),
      );
    });
  });

  it('should show success snackbar on successful submission', async () => {
    mockMutate.mockImplementation((_values, options) => {
      options?.onSuccess?.();
    });

    render(<ExpenseForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Morning coffee' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-03-15' } });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    const option = await screen.findByRole('option', { name: 'Dining out' });
    fireEvent.click(option);

    const paymentSelect = screen.getByLabelText('Payment Source');
    fireEvent.mouseDown(paymentSelect);
    const payOption = await screen.findByRole('option', { name: 'Cash' });
    fireEvent.click(payOption);

    fireEvent.click(screen.getByRole('button', { name: 'Submit expense' }));

    await waitFor(() => {
      expect(screen.getByText('Expense saved successfully!')).toBeInTheDocument();
    });
  });

  it('should show error snackbar on failed submission', async () => {
    mockMutate.mockImplementation((_values, options) => {
      options?.onError?.(new Error('Network timeout'));
    });

    render(<ExpenseForm />, { wrapper: createWrapper() });

    fireEvent.change(screen.getByLabelText('Amount'), { target: { value: '10' } });
    fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Morning coffee' } });
    fireEvent.change(screen.getByLabelText('Date'), { target: { value: '2024-03-15' } });

    const categorySelect = screen.getByLabelText('Category');
    fireEvent.mouseDown(categorySelect);
    const option = await screen.findByRole('option', { name: 'Dining out' });
    fireEvent.click(option);

    const paymentSelect = screen.getByLabelText('Payment Source');
    fireEvent.mouseDown(paymentSelect);
    const payOption = await screen.findByRole('option', { name: 'Debit' });
    fireEvent.click(payOption);

    fireEvent.click(screen.getByRole('button', { name: 'Submit expense' }));

    await waitFor(() => {
      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });
  });

  it('should render submit button with Save Expense text when not loading', () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });
    expect(screen.getByRole('button', { name: 'Submit expense' })).toHaveTextContent('Save Expense');
  });

  it('should default date to today', () => {
    render(<ExpenseForm />, { wrapper: createWrapper() });

    const dateField = screen.getByLabelText('Date') as HTMLInputElement;
    const today = new Date().toISOString().split('T')[0];
    expect(dateField.value).toBe(today);
  });
});
