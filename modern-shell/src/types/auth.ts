export interface MockUserMetadata {
  creationTime: string;
  lastSignInTime: string;
}

export interface MockUser {
  uid: string;
  email: string;
  displayName: string | null;
  metadata: MockUserMetadata;
}

export interface UserDetails {
  firstName: string;
  lastName: string;
}

export interface AuthContextType {
  user: MockUser | null;
  userDetails: UserDetails | null;
  loading: boolean;
  error: string | null;
  logIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setUserDetails: (details: UserDetails | null) => void;
}
