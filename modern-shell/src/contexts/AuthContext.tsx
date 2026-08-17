import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { AuthContextType, MockUser, UserDetails } from '../types/auth';

const MOCK_USER_KEY = 'mock_user';
const MOCK_DELAY_MS = 10;

function generateDeterministicUid(email: string): string {
  let hash = 0;
  for (let i = 0; i < email.length; i++) {
    const char = email.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0;
  }
  return `mock-uid-${Math.abs(hash).toString(16).padStart(8, '0')}`;
}

function createMockUser(email: string): MockUser {
  const now = new Date().toISOString();
  return {
    uid: generateDeterministicUid(email),
    email,
    displayName: email.split('@')[0],
    metadata: {
      creationTime: now,
      lastSignInTime: now,
    },
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [userDetails, setUserDetails] = useState<UserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(MOCK_USER_KEY);
    if (stored) {
      setUser(JSON.parse(stored) as MockUser);
    }
    setLoading(false);
  }, []);

  async function logIn(email: string, _password: string): Promise<void> {
    setError(null);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    try {
      const stored = localStorage.getItem(MOCK_USER_KEY);
      let mockUser: MockUser;
      if (stored) {
        mockUser = JSON.parse(stored) as MockUser;
        mockUser.metadata.lastSignInTime = new Date().toISOString();
      } else {
        mockUser = createMockUser(email);
      }
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Login failed';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signUp(email: string, _password: string): Promise<void> {
    setError(null);
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    try {
      const mockUser = createMockUser(email);
      localStorage.setItem(MOCK_USER_KEY, JSON.stringify(mockUser));
      setUser(mockUser);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Sign up failed';
      setError(message);
      throw e;
    } finally {
      setLoading(false);
    }
  }

  async function signOut(): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, MOCK_DELAY_MS));
    localStorage.removeItem(MOCK_USER_KEY);
    setUser(null);
    setUserDetails(null);
  }

  const value: AuthContextType = {
    user,
    userDetails,
    loading,
    error,
    logIn,
    signUp,
    signOut,
    setUserDetails,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
