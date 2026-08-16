import { describe, it, expect, beforeAll, afterAll, afterEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { ManageOptions } from '../ManageOptions';
import { NotificationProvider } from '@/components/shared/NotificationProvider';

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

vi.mock('@/config/firebase', () => ({
  auth: { currentUser: { uid: 'test-user-123', getIdToken: () => Promise.resolve('token') } },
  database: {},
}));

let serverCategories = ['Food', 'Travel', 'Shopping'];

const mockGet = vi.fn();
const mockSet = vi.fn();

vi.mock('firebase/database', () => ({
  ref: (_db: unknown, path: string) => ({ path }),
  get: (...args: unknown[]) => mockGet(...args),
  set: (...args: unknown[]) => mockSet(...args),
}));

const server = setupServer(
  http.get('/api/settings/:userId', () => {
    return HttpResponse.json({
      categories: serverCategories,
      types: ['Manual', 'Import'],
    });
  }),
  http.put('/api/settings/:userId/:key', async ({ request }) => {
    const body = (await request.json()) as string[];
    serverCategories = body;
    return HttpResponse.json(body);
  }),
);

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <NotificationProvider>{children}</NotificationProvider>
      </QueryClientProvider>
    );
  };
}

const defaultProps = {
  title: 'Categories',
  subtitle: 'Manage your expense categories',
  label: 'Category',
  placeholder: 'Add a category',
  settingsKey: 'categories' as const,
};

describe('ManageOptions Integration (MSW)', () => {
  beforeAll(() => server.listen({ onUnhandledRequest: 'bypass' }));
  afterEach(() => {
    server.resetHandlers();
    serverCategories = ['Food', 'Travel', 'Shopping'];
    vi.clearAllMocks();
  });
  afterAll(() => server.close());

  it('should fetch settings from Firebase and render chips', async () => {
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        categories: { 0: 'Food', 1: 'Travel', 2: 'Shopping' },
        types: { 0: 'Manual', 1: 'Import' },
      }),
    });

    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
    expect(screen.getByText('Travel')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('should save to Firebase and invalidate query cache on successful mutation', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        categories: { 0: 'Food', 1: 'Travel' },
        types: { 0: 'Manual' },
      }),
    });
    mockSet.mockResolvedValue(undefined);

    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'Groceries{Enter}');
    expect(screen.getByText('Groceries')).toBeInTheDocument();

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockSet).toHaveBeenCalledWith(
        { path: 'users/test-user-123/categories' },
        ['Food', 'Travel', 'Groceries'],
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Categories saved!')).toBeInTheDocument();
    });

    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it('should display error snackbar when Firebase save fails', async () => {
    const user = userEvent.setup();
    mockGet.mockResolvedValue({
      exists: () => true,
      val: () => ({
        categories: { 0: 'Food' },
        types: { 0: 'Manual' },
      }),
    });
    mockSet.mockRejectedValue(new Error('Permission denied'));

    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'NewItem{Enter}');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Permission denied')).toBeInTheDocument();
    });
  });

  it('should show default categories when user has no saved settings', async () => {
    mockGet.mockResolvedValue({
      exists: () => false,
      val: () => null,
    });

    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
    expect(screen.getByText('Transport')).toBeInTheDocument();
    expect(screen.getByText('Other')).toBeInTheDocument();
  });
});
