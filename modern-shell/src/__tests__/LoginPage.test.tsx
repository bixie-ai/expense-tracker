import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockLogIn = vi.fn();
const mockSignUp = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    logIn: mockLogIn,
    signUp: mockSignUp,
    loading: false,
    error: null,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null, pathname: '/login', search: '', hash: '', key: 'default' }),
  };
});

import { LoginPage } from '../pages/LoginPage';

function renderLoginPage() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <LoginPage />
    </MemoryRouter>
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLogIn.mockResolvedValue(undefined);
    mockSignUp.mockResolvedValue(undefined);
  });

  describe('rendering', () => {
    it('should render email and password fields', () => {
      renderLoginPage();
      expect(screen.getByLabelText('Email')).toBeInTheDocument();
      expect(screen.getByLabelText('Password')).toBeInTheDocument();
    });

    it('should render sign in button by default', () => {
      renderLoginPage();
      expect(screen.getByRole('button', { name: 'Sign In' })).toBeInTheDocument();
    });

    it('should render toggle link to sign up', () => {
      renderLoginPage();
      expect(screen.getByText("Don't have an account? Sign up")).toBeInTheDocument();
    });
  });

  describe('form validation', () => {
    it('should show error when email is empty', async () => {
      renderLoginPage();

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
      });
    });

    it('should show error for invalid email', async () => {
      renderLoginPage();

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'invalid' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid email address')).toBeInTheDocument();
      });
    });

    it('should show error for short password', async () => {
      renderLoginPage();

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: '12345' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(screen.getByText('Password must be at least 6 characters')).toBeInTheDocument();
      });
    });
  });

  describe('login submission', () => {
    it('should call logIn with email and password on valid submit', async () => {
      renderLoginPage();

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(mockLogIn).toHaveBeenCalledWith('test@test.com', 'password123');
      });
    });

    it('should navigate on successful login', async () => {
      renderLoginPage();

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
      });
    });

    it('should display error message on login failure', async () => {
      mockLogIn.mockRejectedValueOnce(new Error('Login failed'));
      renderLoginPage();

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Login failed');
      });
    });

    it('should display generic error for non-Error objects', async () => {
      mockLogIn.mockRejectedValueOnce('something went wrong');
      renderLoginPage();

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          'An unexpected error occurred. Please try again.'
        );
      });
    });
  });

  describe('sign up mode', () => {
    it('should switch to sign up mode when toggle is clicked', async () => {
      renderLoginPage();

      await act(async () => {
        fireEvent.click(screen.getByText("Don't have an account? Sign up"));
      });

      expect(screen.getByRole('button', { name: 'Create Account' })).toBeInTheDocument();
      expect(screen.getByText('Already have an account? Sign in')).toBeInTheDocument();
    });

    it('should call signUp when in sign up mode', async () => {
      renderLoginPage();

      await act(async () => {
        fireEvent.click(screen.getByText("Don't have an account? Sign up"));
      });

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'new@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      });

      await waitFor(() => {
        expect(mockSignUp).toHaveBeenCalledWith('new@test.com', 'password123');
      });
    });

    it('should display error on sign up failure', async () => {
      mockSignUp.mockRejectedValueOnce(new Error('Registration failed'));
      renderLoginPage();

      await act(async () => {
        fireEvent.click(screen.getByText("Don't have an account? Sign up"));
      });

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'existing@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Create Account' }));
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Registration failed');
      });
    });

    it('should clear error when switching between login and sign up', async () => {
      mockLogIn.mockRejectedValueOnce(new Error('Login failed'));
      renderLoginPage();

      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'test@test.com' } });
      fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'password123' } });

      await act(async () => {
        fireEvent.click(screen.getByRole('button', { name: 'Sign In' }));
      });

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });

      await act(async () => {
        fireEvent.click(screen.getByText("Don't have an account? Sign up"));
      });

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
