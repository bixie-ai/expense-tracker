import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

const mockOnAuthStateChanged = vi.fn();
const mockSignInWithEmailAndPassword = vi.fn();
const mockCreateUserWithEmailAndPassword = vi.fn();
const mockSignOut = vi.fn();

vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  onAuthStateChanged: (...args: unknown[]) => mockOnAuthStateChanged(...args),
  signInWithEmailAndPassword: (...args: unknown[]) => mockSignInWithEmailAndPassword(...args),
  createUserWithEmailAndPassword: (...args: unknown[]) => mockCreateUserWithEmailAndPassword(...args),
  signOut: (...args: unknown[]) => mockSignOut(...args),
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
}));

import { AuthProvider, useAuth } from '../contexts/AuthContext';

function TestConsumer() {
  const { user, userDetails, loading, error } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.uid : 'null'}</span>
      <span data-testid="userDetails">
        {userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : 'null'}
      </span>
      <span data-testid="error">{error || 'null'}</span>
    </div>
  );
}

function AuthActionsConsumer() {
  const { logIn, signUp, signOut, setUserDetails } = useAuth();
  return (
    <div>
      <button onClick={() => logIn('test@test.com', 'password123')}>Log In</button>
      <button onClick={() => signUp('new@test.com', 'password123')}>Sign Up</button>
      <button onClick={() => signOut()}>Sign Out</button>
      <button onClick={() => setUserDetails({ firstName: 'John', lastName: 'Doe' })}>
        Set Details
      </button>
      <button onClick={() => setUserDetails(null)}>Clear Details</button>
    </div>
  );
}

function renderWithProvider(ui: React.ReactElement) {
  return render(
    <MemoryRouter>
      <AuthProvider>{ui}</AuthProvider>
    </MemoryRouter>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
      callback(null);
      return vi.fn();
    });
    mockSignInWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'user-123', email: 'test@test.com' },
    });
    mockCreateUserWithEmailAndPassword.mockResolvedValue({
      user: { uid: 'new-user-456', email: 'new@test.com' },
    });
    mockSignOut.mockResolvedValue(undefined);
  });

  describe('initial state', () => {
    it('should start in loading state before auth resolves', () => {
      mockOnAuthStateChanged.mockImplementation(() => vi.fn());
      renderWithProvider(<TestConsumer />);
      expect(screen.getByTestId('loading').textContent).toBe('true');
    });

    it('should set loading to false after auth state resolves with no user', () => {
      renderWithProvider(<TestConsumer />);
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should have null error state initially', () => {
      renderWithProvider(<TestConsumer />);
      expect(screen.getByTestId('error').textContent).toBe('null');
    });

    it('should set user when auth state resolves with a user', () => {
      const mockUser = { uid: 'user-123', email: 'test@test.com' };
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
        callback(mockUser);
        return vi.fn();
      });
      renderWithProvider(<TestConsumer />);
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('user-123');
    });

    it('should clear userDetails when user signs out via auth state change', () => {
      const mockUser = { uid: 'user-123', email: 'test@test.com' };
      let authCallback: (user: unknown) => void = () => {};
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
        authCallback = callback;
        callback(mockUser);
        return vi.fn();
      });

      renderWithProvider(
        <>
          <TestConsumer />
          <AuthActionsConsumer />
        </>
      );

      act(() => {
        screen.getByText('Set Details').click();
      });
      expect(screen.getByTestId('userDetails').textContent).toBe('John Doe');

      act(() => {
        authCallback(null);
      });
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('userDetails').textContent).toBe('null');
    });
  });

  describe('logIn', () => {
    it('should call signInWithEmailAndPassword with correct args', async () => {
      renderWithProvider(<AuthActionsConsumer />);
      await act(async () => {
        screen.getByText('Log In').click();
      });
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@test.com',
        'password123'
      );
    });

    it('should set loading to true during logIn', async () => {
      let resolveLogin: (value: unknown) => void = () => {};
      mockSignInWithEmailAndPassword.mockImplementation(() => new Promise((resolve) => {
        resolveLogin = resolve;
      }));

      renderWithProvider(
        <>
          <TestConsumer />
          <AuthActionsConsumer />
        </>
      );

      expect(screen.getByTestId('loading').textContent).toBe('false');

      act(() => {
        screen.getByText('Log In').click();
      });
      expect(screen.getByTestId('loading').textContent).toBe('true');

      await act(async () => {
        resolveLogin({ user: { uid: 'user-123' } });
      });
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should set error state on login failure', async () => {
      const error = new Error('auth/user-not-found');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      function ErrorCapture() {
        const { logIn, error } = useAuth();
        return (
          <div>
            <button
              onClick={async () => {
                try {
                  await logIn('test@test.com', 'wrong');
                } catch (_e) {
                  // error is captured in context state
                }
              }}
            >
              Try Login
            </button>
            <span data-testid="ctx-error">{error || 'null'}</span>
          </div>
        );
      }

      renderWithProvider(<ErrorCapture />);
      await act(async () => {
        screen.getByText('Try Login').click();
      });
      expect(screen.getByTestId('ctx-error').textContent).toBe('auth/user-not-found');
    });

    it('should propagate errors from signInWithEmailAndPassword', async () => {
      const error = new Error('auth/wrong-password');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);

      function ErrorCapture() {
        const { logIn } = useAuth();
        const [errorMsg, setErrorMsg] = React.useState('');
        return (
          <div>
            <button
              onClick={async () => {
                try {
                  await logIn('test@test.com', 'wrong');
                } catch (e) {
                  setErrorMsg((e as Error).message);
                }
              }}
            >
              Try Login
            </button>
            <span data-testid="error">{errorMsg}</span>
          </div>
        );
      }

      renderWithProvider(<ErrorCapture />);
      await act(async () => {
        screen.getByText('Try Login').click();
      });
      expect(screen.getByTestId('error').textContent).toBe('auth/wrong-password');
    });

    it('should clear error on subsequent login attempt', async () => {
      const error = new Error('auth/wrong-password');
      mockSignInWithEmailAndPassword.mockRejectedValueOnce(error);
      mockSignInWithEmailAndPassword.mockResolvedValueOnce({
        user: { uid: 'user-123' },
      });

      function ErrorCapture() {
        const { logIn, error } = useAuth();
        return (
          <div>
            <button
              onClick={async () => {
                try {
                  await logIn('test@test.com', 'password');
                } catch (_e) {
                  // expected on first call
                }
              }}
            >
              Try Login
            </button>
            <span data-testid="ctx-error">{error || 'null'}</span>
          </div>
        );
      }

      renderWithProvider(<ErrorCapture />);

      await act(async () => {
        screen.getByText('Try Login').click();
      });
      expect(screen.getByTestId('ctx-error').textContent).toBe('auth/wrong-password');

      await act(async () => {
        screen.getByText('Try Login').click();
      });
      expect(screen.getByTestId('ctx-error').textContent).toBe('null');
    });
  });

  describe('signUp', () => {
    it('should call createUserWithEmailAndPassword with correct args', async () => {
      renderWithProvider(<AuthActionsConsumer />);
      await act(async () => {
        screen.getByText('Sign Up').click();
      });
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'new@test.com',
        'password123'
      );
    });

    it('should set loading to true during signUp', async () => {
      let resolveSignUp: (value: unknown) => void = () => {};
      mockCreateUserWithEmailAndPassword.mockImplementation(() => new Promise((resolve) => {
        resolveSignUp = resolve;
      }));

      renderWithProvider(
        <>
          <TestConsumer />
          <AuthActionsConsumer />
        </>
      );

      expect(screen.getByTestId('loading').textContent).toBe('false');

      act(() => {
        screen.getByText('Sign Up').click();
      });
      expect(screen.getByTestId('loading').textContent).toBe('true');

      await act(async () => {
        resolveSignUp({ user: { uid: 'new-user-456' } });
      });
      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should set error state on signUp failure', async () => {
      const error = new Error('auth/email-already-in-use');
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      function ErrorCapture() {
        const { signUp, error } = useAuth();
        return (
          <div>
            <button
              onClick={async () => {
                try {
                  await signUp('new@test.com', 'password');
                } catch (_e) {
                  // error captured in context
                }
              }}
            >
              Try SignUp
            </button>
            <span data-testid="ctx-error">{error || 'null'}</span>
          </div>
        );
      }

      renderWithProvider(<ErrorCapture />);
      await act(async () => {
        screen.getByText('Try SignUp').click();
      });
      expect(screen.getByTestId('ctx-error').textContent).toBe('auth/email-already-in-use');
    });

    it('should propagate errors from createUserWithEmailAndPassword', async () => {
      const error = new Error('auth/email-already-in-use');
      mockCreateUserWithEmailAndPassword.mockRejectedValueOnce(error);

      function ErrorCapture() {
        const { signUp } = useAuth();
        const [errorMsg, setErrorMsg] = React.useState('');
        return (
          <div>
            <button
              onClick={async () => {
                try {
                  await signUp('new@test.com', 'password');
                } catch (e) {
                  setErrorMsg((e as Error).message);
                }
              }}
            >
              Try SignUp
            </button>
            <span data-testid="error">{errorMsg}</span>
          </div>
        );
      }

      renderWithProvider(<ErrorCapture />);
      await act(async () => {
        screen.getByText('Try SignUp').click();
      });
      expect(screen.getByTestId('error').textContent).toBe('auth/email-already-in-use');
    });
  });

  describe('signOut', () => {
    it('should call firebase signOut and reset state', async () => {
      const mockUser = { uid: 'user-123', email: 'test@test.com' };
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
        callback(mockUser);
        return vi.fn();
      });

      renderWithProvider(
        <>
          <TestConsumer />
          <AuthActionsConsumer />
        </>
      );

      expect(screen.getByTestId('user').textContent).toBe('user-123');

      act(() => {
        screen.getByText('Set Details').click();
      });
      expect(screen.getByTestId('userDetails').textContent).toBe('John Doe');

      await act(async () => {
        screen.getByText('Sign Out').click();
      });

      expect(mockSignOut).toHaveBeenCalled();
      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('userDetails').textContent).toBe('null');
    });
  });

  describe('setUserDetails', () => {
    it('should update userDetails state', () => {
      renderWithProvider(
        <>
          <TestConsumer />
          <AuthActionsConsumer />
        </>
      );

      act(() => {
        screen.getByText('Set Details').click();
      });
      expect(screen.getByTestId('userDetails').textContent).toBe('John Doe');
    });

    it('should clear userDetails when set to null', () => {
      renderWithProvider(
        <>
          <TestConsumer />
          <AuthActionsConsumer />
        </>
      );

      act(() => {
        screen.getByText('Set Details').click();
      });
      expect(screen.getByTestId('userDetails').textContent).toBe('John Doe');

      act(() => {
        screen.getByText('Clear Details').click();
      });
      expect(screen.getByTestId('userDetails').textContent).toBe('null');
    });
  });

  describe('useAuth outside provider', () => {
    it('should throw when used outside AuthProvider', () => {
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() => render(<TestConsumer />)).toThrow(
        'useAuth must be used within an AuthProvider'
      );
      spy.mockRestore();
    });
  });

  describe('cleanup', () => {
    it('should unsubscribe from auth state on unmount', () => {
      const unsubscribe = vi.fn();
      mockOnAuthStateChanged.mockImplementation((_auth: unknown, callback: (user: unknown) => void) => {
        callback(null);
        return unsubscribe;
      });

      const { unmount } = renderWithProvider(<TestConsumer />);
      unmount();
      expect(unsubscribe).toHaveBeenCalled();
    });
  });
});
