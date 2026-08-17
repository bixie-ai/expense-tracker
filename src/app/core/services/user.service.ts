import { computed, Injectable, Signal, signal, WritableSignal } from '@angular/core';
import { MockUser } from '../interfaces/user-model';
import { UserDetails } from '../interfaces/user-details';

const MOCK_USER_KEY = 'mock_user';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  currentUser: WritableSignal<MockUser | undefined> = signal(undefined);
  userDetails: WritableSignal<UserDetails | undefined> = signal(undefined);
  fullName: Signal<string> = computed(() => {
    const user = this.userDetails();
    if (user) {
      return `${user.firstName} ${user.lastName}`;
    }
    return '';
  });
  abbreviatedDisplay: Signal<string> = computed(() => {
    const user = this.userDetails();
    if (user) {
      return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`;
    }
    return '';
  });
  email: Signal<string> = computed(() => {
    const user = this.currentUser();
    return user?.email ?? '';
  });

  private userId = '';

  constructor() {
    this.loadFromLocalStorage();
  }

  setUser(data: MockUser | undefined) {
    this.currentUser.set(data);
  }

  setUserDetails(data: UserDetails | undefined) {
    this.userDetails.set(data);
  }

  getUser(): MockUser | undefined {
    return this.currentUser();
  }

  setUserId(key: string) {
    this.userId = key;
  }

  getUserId(): string {
    return this.userId;
  }

  private loadFromLocalStorage() {
    const stored = localStorage.getItem(MOCK_USER_KEY);
    if (stored) {
      const user = JSON.parse(stored) as MockUser;
      this.currentUser.set(user);
      this.userId = user.uid;
    }
  }
}
