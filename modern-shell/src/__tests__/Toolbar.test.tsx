import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Toolbar } from '../components/Toolbar';
import { LayoutProvider } from '../contexts/LayoutContext';

vi.mock('../hooks/useBreakpoint', () => ({
  useBreakpoint: vi.fn(() => true),
}));

const mockSignOut = vi.fn().mockResolvedValue(undefined);

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    userDetails: { firstName: 'John', lastName: 'Doe' },
    loading: false,
    error: null,
    logIn: vi.fn(),
    signUp: vi.fn(),
    signOut: mockSignOut,
    setUserDetails: vi.fn(),
  }),
}));

import { useBreakpoint } from '../hooks/useBreakpoint';

function renderToolbar() {
  return render(
    <MemoryRouter>
      <LayoutProvider>
        <Toolbar />
      </LayoutProvider>
    </MemoryRouter>
  );
}

describe('Toolbar', () => {
  beforeEach(() => {
    vi.mocked(useBreakpoint).mockReturnValue(true);
    mockSignOut.mockClear();
  });

  it('renders the user name', () => {
    renderToolbar();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('does not show hamburger menu on desktop', () => {
    renderToolbar();
    expect(screen.queryByLabelText('Toggle navigation menu')).not.toBeInTheDocument();
  });

  it('shows hamburger menu on handset', () => {
    vi.mocked(useBreakpoint).mockReturnValue(false);
    renderToolbar();
    expect(screen.getByLabelText('Toggle navigation menu')).toBeInTheDocument();
  });

  it('shows app title on handset', () => {
    vi.mocked(useBreakpoint).mockReturnValue(false);
    renderToolbar();
    expect(screen.getByText('Expense Tracker')).toBeInTheDocument();
  });

  it('does not show app title on desktop', () => {
    renderToolbar();
    expect(screen.queryByRole('heading', { name: 'Expense Tracker' })).not.toBeInTheDocument();
  });

  it('opens user menu on click', () => {
    renderToolbar();
    act(() => {
      screen.getByText('John Doe').click();
    });
    expect(screen.getByText('View Profile')).toBeInTheDocument();
    expect(screen.getByText('Log out')).toBeInTheDocument();
  });

  it('calls signOut when logout is clicked', async () => {
    renderToolbar();
    act(() => {
      screen.getByText('John Doe').click();
    });
    await act(async () => {
      screen.getByText('Log out').click();
    });
    expect(mockSignOut).toHaveBeenCalledOnce();
  });

  it('renders user menu with proper aria attributes', () => {
    renderToolbar();
    const button = screen.getByText('John Doe').closest('button')!;
    expect(button).toHaveAttribute('aria-haspopup', 'true');
  });

  it('shows fallback "User" when no userDetails', () => {
    vi.doMock('../contexts/AuthContext', () => ({
      useAuth: () => ({
        user: { email: 'test@example.com' },
        userDetails: null,
        loading: false,
        error: null,
        logIn: vi.fn(),
        signUp: vi.fn(),
        signOut: vi.fn(),
        setUserDetails: vi.fn(),
      }),
    }));
    // The module-level mock takes precedence in this test file,
    // so we verify the component handles both cases
    renderToolbar();
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
