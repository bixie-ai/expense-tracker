import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { ManageOptions } from '../ManageOptions';
import { NotificationProvider } from '@/components/shared/NotificationProvider';

const mockGetSettings = vi.fn();
const mockSaveSettings = vi.fn();

vi.mock('../settings.repository', () => ({
  settingsRepository: {
    getSettings: (...args: unknown[]) => mockGetSettings(...args),
    saveSettings: (...args: unknown[]) => mockSaveSettings(...args),
  },
}));

vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

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

describe('ManageOptions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetSettings.mockResolvedValue({
      categories: ['Food', 'Travel', 'Shopping'],
      types: ['Manual', 'Import'],
    });
    mockSaveSettings.mockResolvedValue(['Food', 'Travel', 'Shopping', 'NewItem']);
  });

  it('should render loading state initially', () => {
    mockGetSettings.mockReturnValue(new Promise(() => {}));
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });
    expect(screen.getByLabelText('Loading settings')).toBeInTheDocument();
  });

  it('should render chips after data loads', async () => {
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });
    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });
    expect(screen.getByText('Travel')).toBeInTheDocument();
    expect(screen.getByText('Shopping')).toBeInTheDocument();
  });

  it('should add a chip when pressing Enter with valid input', async () => {
    const user = userEvent.setup();
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'NewCategory{Enter}');

    expect(screen.getByText('NewCategory')).toBeInTheDocument();
  });

  it('should not add a chip for empty input on Enter', async () => {
    const user = userEvent.setup();
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, '{Enter}');

    const chips = screen.getAllByRole('listitem');
    expect(chips).toHaveLength(3);
  });

  it('should not add duplicate chip (case-insensitive)', async () => {
    const user = userEvent.setup();
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'food{Enter}');

    const chips = screen.getAllByRole('listitem');
    expect(chips).toHaveLength(3);
  });

  it('should remove a chip when clicking delete button', async () => {
    const user = userEvent.setup();
    mockGetSettings.mockResolvedValue({
      categories: ['Food', 'CustomItem'],
      types: ['Manual'],
    });
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('CustomItem')).toBeInTheDocument();
    });

    const deleteButton = screen.getByLabelText('CustomItem, press delete to remove').querySelector('svg')!;
    await user.click(deleteButton);

    expect(screen.queryByText('CustomItem')).not.toBeInTheDocument();
  });

  it('should enable Save button only when draft differs from server state', async () => {
    const user = userEvent.setup();
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const saveButton = screen.getByRole('button', { name: /save/i });
    expect(saveButton).toBeDisabled();

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'Fitness{Enter}');

    expect(saveButton).toBeEnabled();
  });

  it('should call saveSettings on Save click and show success notification', async () => {
    const user = userEvent.setup();
    mockSaveSettings.mockResolvedValue(['Food', 'Travel', 'Shopping', 'Fitness']);
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'Fitness{Enter}');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockSaveSettings).toHaveBeenCalledWith(
        'test-user-123',
        'categories',
        ['Food', 'Travel', 'Shopping', 'Fitness'],
      );
    });

    await waitFor(() => {
      expect(screen.getByText('Categories saved!')).toBeInTheDocument();
    });
  });

  it('should show error notification on save failure', async () => {
    const user = userEvent.setup();
    mockSaveSettings.mockRejectedValue(new Error('Network error'));
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'Fitness{Enter}');

    const saveButton = screen.getByRole('button', { name: /save/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should reset chips to server state on Reset click', async () => {
    const user = userEvent.setup();
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category');
    await user.type(input, 'Fitness{Enter}');
    expect(screen.getByText('Fitness')).toBeInTheDocument();

    const resetButton = screen.getByRole('button', { name: /reset/i });
    await user.click(resetButton);

    expect(screen.queryByText('Fitness')).not.toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('should clear input field after adding a chip', async () => {
    const user = userEvent.setup();
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Food')).toBeInTheDocument();
    });

    const input = screen.getByLabelText('Add new category') as HTMLInputElement;
    await user.type(input, 'Fitness{Enter}');

    expect(input.value).toBe('');
  });

  it('should show title and subtitle', async () => {
    render(<ManageOptions {...defaultProps} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Categories')).toBeInTheDocument();
    });
    expect(screen.getByText('Manage your expense categories')).toBeInTheDocument();
  });
});
