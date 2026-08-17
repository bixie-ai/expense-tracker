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

export interface User {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  expensesEntered?: number;
  lastLogin?: string;
  creationDate?: string;
}
