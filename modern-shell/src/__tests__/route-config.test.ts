import { describe, it, expect } from 'vitest';
import {
  routeConfig,
  getLegacyRoutes,
  getMigratedRoutes,
  isLegacyRoute,
  getAngularPath,
} from '../config/route-config';

describe('route-config', () => {
  describe('routeConfig', () => {
    it('contains all expected Angular routes', () => {
      const paths = routeConfig.map((r) => r.path);
      expect(paths).toContain('login');
      expect(paths).toContain('dashboard');
      expect(paths).toContain('settings');
      expect(paths).toContain('new-expense');
      expect(paths).toContain('import-expenses');
    });

    it('each entry has a valid status', () => {
      for (const entry of routeConfig) {
        expect(['legacy', 'migrated']).toContain(entry.status);
      }
    });

    it('legacy entries have an angularPath defined', () => {
      const legacy = routeConfig.filter((r) => r.status === 'legacy');
      for (const entry of legacy) {
        expect(entry.angularPath).toBeDefined();
        expect(entry.angularPath).toMatch(/^\//);
      }
    });
  });

  describe('getLegacyRoutes', () => {
    it('returns only routes with status "legacy"', () => {
      const legacy = getLegacyRoutes();
      for (const route of legacy) {
        expect(route.status).toBe('legacy');
      }
    });

    it('returns a non-empty array when legacy routes exist', () => {
      expect(getLegacyRoutes().length).toBeGreaterThan(0);
    });
  });

  describe('getMigratedRoutes', () => {
    it('returns only routes with status "migrated"', () => {
      const migrated = getMigratedRoutes();
      for (const route of migrated) {
        expect(route.status).toBe('migrated');
      }
    });
  });

  describe('isLegacyRoute', () => {
    it('returns true for a known legacy path', () => {
      expect(isLegacyRoute('dashboard')).toBe(true);
    });

    it('returns true for a legacy path with leading slash', () => {
      expect(isLegacyRoute('/dashboard')).toBe(true);
    });

    it('returns false for an unknown path', () => {
      expect(isLegacyRoute('/some-new-page')).toBe(false);
    });

    it('returns false for an empty string', () => {
      expect(isLegacyRoute('')).toBe(false);
    });
  });

  describe('getAngularPath', () => {
    it('returns the configured angularPath for a known route', () => {
      expect(getAngularPath('dashboard')).toBe('/dashboard');
      expect(getAngularPath('new-expense')).toBe('/new-expense');
    });

    it('handles leading slash in input', () => {
      expect(getAngularPath('/settings')).toBe('/settings');
    });

    it('returns a fallback path for unknown routes', () => {
      expect(getAngularPath('/unknown-page')).toBe('/unknown-page');
    });

    it('returns fallback with leading slash for bare unknown path', () => {
      expect(getAngularPath('unknown')).toBe('/unknown');
    });
  });
});
