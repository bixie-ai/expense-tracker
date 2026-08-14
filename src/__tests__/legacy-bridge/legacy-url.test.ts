import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildLegacyUrl, getLegacyOrigin } from '../../legacy-bridge/legacy-url';

describe('legacy-url', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('getLegacyOrigin', () => {
    it('returns default /legacy-app when env var is not set', () => {
      vi.stubEnv('VITE_LEGACY_ORIGIN', '');
      expect(getLegacyOrigin()).toBe('/legacy-app');
    });

    it('returns env var value when set', () => {
      vi.stubEnv('VITE_LEGACY_ORIGIN', 'http://localhost:4201');
      expect(getLegacyOrigin()).toBe('http://localhost:4201');
    });
  });

  describe('buildLegacyUrl', () => {
    it('builds URL from default origin and path', () => {
      vi.stubEnv('VITE_LEGACY_ORIGIN', '');
      expect(buildLegacyUrl('dashboard')).toBe('/legacy-app/dashboard');
    });

    it('strips leading slashes from path', () => {
      vi.stubEnv('VITE_LEGACY_ORIGIN', '');
      expect(buildLegacyUrl('/settings')).toBe('/legacy-app/settings');
      expect(buildLegacyUrl('///login')).toBe('/legacy-app/login');
    });

    it('uses custom origin from env', () => {
      vi.stubEnv('VITE_LEGACY_ORIGIN', 'http://angular.local');
      expect(buildLegacyUrl('dashboard')).toBe('http://angular.local/dashboard');
    });
  });
});
