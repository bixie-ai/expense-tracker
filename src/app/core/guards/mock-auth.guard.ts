import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

const MOCK_USER_KEY = 'mock_user';

export const mockAuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const stored = localStorage.getItem(MOCK_USER_KEY);
  if (stored) {
    return true;
  }
  return router.createUrlTree(['/login']);
};

export const mockLoginGuard: CanActivateFn = () => {
  const router = inject(Router);
  const stored = localStorage.getItem(MOCK_USER_KEY);
  if (stored) {
    return router.createUrlTree(['/dashboard']);
  }
  return true;
};
