import { User as FirebaseUser } from 'firebase/auth';

export interface UserDetails {
  firstName: string;
  lastName: string;
}

export interface AuthContextType {
  user: FirebaseUser | null;
  userDetails: UserDetails | null;
  loading: boolean;
  logIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUserDetails: (details: UserDetails | null) => void;
}
