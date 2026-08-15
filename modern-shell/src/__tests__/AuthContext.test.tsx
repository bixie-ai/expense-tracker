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
  const { user, userDetails, loading } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.uid : 'null'}</span>
      <span data-testid="userDetails">
        {userDetails ? `${userDetails.firstName} ${userDetails.lastName}` : 'null'}
      </span>
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
