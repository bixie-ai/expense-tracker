import { Injectable } from '@angular/core';
import { MockUser, MockUserMetadata } from '../interfaces/user-model';

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
  const metadata: MockUserMetadata = {
    creationTime: now,
    lastSignInTime: now,
  };
  return {
    uid: generateDeterministicUid(email),
    email,
    displayName: email.split('@')[0],
    metadata,
  };
}

export interface MockUserCredential {
  user: MockUser;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  signUp(email: string, _pw: string): Promise<MockUserCredential> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const user = createMockUser(email);
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
        resolve({ user });
      }, MOCK_DELAY_MS);
    });
  }

  logIn(email: string, _pw: string): Promise<MockUserCredential> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const stored = localStorage.getItem(MOCK_USER_KEY);
        let user: MockUser;
        if (stored) {
          user = JSON.parse(stored) as MockUser;
          user.metadata.lastSignInTime = new Date().toISOString();
        } else {
          user = createMockUser(email);
        }
        localStorage.setItem(MOCK_USER_KEY, JSON.stringify(user));
        resolve({ user });
      }, MOCK_DELAY_MS);
    });
  }

  signOut(): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(() => {
        localStorage.removeItem(MOCK_USER_KEY);
        resolve();
      }, MOCK_DELAY_MS);
    });
  }
}
