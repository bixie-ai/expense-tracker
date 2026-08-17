import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';

const MOCK_USER_KEY = 'mock_user';

function TestConsumer() {
  const { user, userDetails, loading, error } = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(loading)}</span>
      <span data-testid="user">{user ? user.uid : 'null'}</span>
      <span data-testid="email">{user ? user.email : 'null'}</span>
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
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('initial state', () => {
    it('should set loading to false after initialization with no stored user', async () => {
      await act(async () => {
        renderWithProvider(<TestConsumer />);
      });
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('null');
    });

    it('should have null error state initially', async () => {
      await act(async () => {
        renderWithProvider(<TestConsumer />);
      });
      expect(screen.getByTestId('error').textContent).toBe('null');
    });

    it('should restore user from localStorage on mount', async () => {
      const storedUser = {
        uid: 'mock-uid-12345678',
        email: 'stored@test.com',
        displayName: 'stored',
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
          lastSignInTime: '2024-01-01T00:00:00.000Z',
        },
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(storedUser));

      await act(async () => {
        renderWithProvider(<TestConsumer />);
      });
      expect(screen.getByTestId('loading').textContent).toBe('false');
      expect(screen.getByTestId('user').textContent).toBe('mock-uid-12345678');
      expect(screen.getByTestId('email').textContent).toBe('stored@test.com');
    });
  });

  describe('logIn', () => {
    it('should create and store a mock user for any email/password', async () => {
      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      await act(async () => {
        screen.getByText('Log In').click();
        await vi.advanceTimersByTimeAsync(20);
      });

      expect(screen.getByTestId('user').textContent).not.toBe('null');
      expect(screen.getByTestId('email').textContent).toBe('test@test.com');
      expect(localStorage.getItem(MOCK_USER_KEY)).not.toBeNull();
    });

    it('should generate a deterministic UID based on email', async () => {
      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      await act(async () => {
        screen.getByText('Log In').click();
        await vi.advanceTimersByTimeAsync(20);
      });

      const uid = screen.getByTestId('user').textContent;
      expect(uid).toMatch(/^mock-uid-[0-9a-f]{8}$/);

      const stored = JSON.parse(localStorage.getItem(MOCK_USER_KEY)!);
      expect(stored.uid).toBe(uid);
    });

    it('should set loading to false after login', async () => {
      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      await act(async () => {
        screen.getByText('Log In').click();
        await vi.advanceTimersByTimeAsync(20);
      });

      expect(screen.getByTestId('loading').textContent).toBe('false');
    });

    it('should update lastSignInTime when logging in with existing user', async () => {
      vi.setSystemTime(new Date('2025-06-01T12:00:00.000Z'));
      const storedUser = {
        uid: 'mock-uid-12345678',
        email: 'test@test.com',
        displayName: 'test',
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
          lastSignInTime: '2024-01-01T00:00:00.000Z',
        },
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(storedUser));

      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      await act(async () => {
        screen.getByText('Log In').click();
        await vi.advanceTimersByTimeAsync(20);
      });

      const updated = JSON.parse(localStorage.getItem(MOCK_USER_KEY)!);
      expect(updated.metadata.lastSignInTime).not.toBe('2024-01-01T00:00:00.000Z');
      expect(updated.metadata.creationTime).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('signUp', () => {
    it('should create a new mock user', async () => {
      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      await act(async () => {
        screen.getByText('Sign Up').click();
        await vi.advanceTimersByTimeAsync(20);
      });

      expect(screen.getByTestId('user').textContent).not.toBe('null');
      expect(screen.getByTestId('email').textContent).toBe('new@test.com');
      expect(localStorage.getItem(MOCK_USER_KEY)).not.toBeNull();
    });

    it('should set loading to false after sign up', async () => {
      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      await act(async () => {
        screen.getByText('Sign Up').click();
        await vi.advanceTimersByTimeAsync(20);
      });

      expect(screen.getByTestId('loading').textContent).toBe('false');
    });
  });

  describe('signOut', () => {
    it('should clear user and localStorage', async () => {
      const storedUser = {
        uid: 'mock-uid-12345678',
        email: 'test@test.com',
        displayName: 'test',
        metadata: {
          creationTime: '2024-01-01T00:00:00.000Z',
          lastSignInTime: '2024-01-01T00:00:00.000Z',
        },
      };
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(storedUser));

      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      expect(screen.getByTestId('user').textContent).toBe('mock-uid-12345678');

      await act(async () => {
        screen.getByText('Sign Out').click();
        await vi.advanceTimersByTimeAsync(20);
      });

      expect(screen.getByTestId('user').textContent).toBe('null');
      expect(screen.getByTestId('userDetails').textContent).toBe('null');
      expect(localStorage.getItem(MOCK_USER_KEY)).toBeNull();
    });
  });

  describe('setUserDetails', () => {
    it('should update userDetails state', async () => {
      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

      act(() => {
        screen.getByText('Set Details').click();
      });
      expect(screen.getByTestId('userDetails').textContent).toBe('John Doe');
    });

    it('should clear userDetails when set to null', async () => {
      await act(async () => {
        renderWithProvider(
          <>
            <TestConsumer />
            <AuthActionsConsumer />
          </>
        );
      });

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
});
