import { describe, it, expect } from 'vitest';
import { isLegacyRoute, findLegacyRoute, getLegacyRoutes } from '../../legacy-bridge/route-registry';

describe('route-registry', () => {
  describe('getLegacyRoutes', () => {
    it('returns all registered legacy routes', () => {
      const routes = getLegacyRoutes();
      expect(routes.length).toBe(5);
      expect(routes.map((r) => r.path)).toEqual([
        'login',
        'dashboard',
        'settings',
        'new-expense',
        'import-expenses',
      ]);
    });

    it('returns routes with titles', () => {
      const routes = getLegacyRoutes();
      for (const route of routes) {
        expect(route.title).toBeTruthy();
      }
    });
  });

  describe('isLegacyRoute', () => {
    it('returns true for known legacy paths', () => {
      expect(isLegacyRoute('/dashboard')).toBe(true);
      expect(isLegacyRoute('/login')).toBe(true);
      expect(isLegacyRoute('/settings')).toBe(true);
      expect(isLegacyRoute('/new-expense')).toBe(true);
      expect(isLegacyRoute('/import-expenses')).toBe(true);
    });

    it('returns true without leading slash', () => {
      expect(isLegacyRoute('dashboard')).toBe(true);
      expect(isLegacyRoute('settings')).toBe(true);
    });

    it('returns true with trailing slash', () => {
      expect(isLegacyRoute('/dashboard/')).toBe(true);
      expect(isLegacyRoute('settings/')).toBe(true);
    });

    it('returns false for unknown routes', () => {
      expect(isLegacyRoute('/unknown')).toBe(false);
      expect(isLegacyRoute('/react-page')).toBe(false);
      expect(isLegacyRoute('')).toBe(false);
    });

    it('handles multiple leading slashes', () => {
      expect(isLegacyRoute('///dashboard')).toBe(true);
    });
  });

  describe('findLegacyRoute', () => {
    it('returns the route entry for a known path', () => {
      const entry = findLegacyRoute('/dashboard');
      expect(entry).toEqual({ path: 'dashboard', title: 'Dashboard' });
    });

    it('returns undefined for an unknown path', () => {
      expect(findLegacyRoute('/not-a-route')).toBeUndefined();
    });

    it('normalizes path before matching', () => {
      const entry = findLegacyRoute('///new-expense///');
      expect(entry).toEqual({ path: 'new-expense', title: 'New Expense' });
    });
  });
});
