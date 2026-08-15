import { describe, it, expect, vi } from 'vitest';
import { createApiProxyConfig, createProxyConfig } from '@/config/proxy';

describe('createProxyConfig', () => {
  const DEFAULT_TARGET = 'http://localhost:4200';

  it('defines a proxy for /api prefix', () => {
    const config = createProxyConfig(DEFAULT_TARGET);
    expect(config).toHaveProperty('/api');
  });

  it('scopes proxy to /api and /angular only', () => {
    const config = createProxyConfig(DEFAULT_TARGET);
    const keys = Object.keys(config);
    expect(keys).toEqual(['/api', '/angular']);
  });

  it('preserves the /angular proxy for legacy routing', () => {
    const config = createProxyConfig(DEFAULT_TARGET);
    expect(config['/angular']).toMatchObject({
      target: 'http://localhost:4201',
      changeOrigin: true,
    });
  });

  it('/angular proxy rewrites path to strip prefix', () => {
    const config = createProxyConfig(DEFAULT_TARGET) as any;
    expect(config['/angular'].rewrite('/angular/app/home')).toBe('/app/home');
  });
});

describe('createApiProxyConfig', () => {
  const TARGET = 'http://localhost:4200';

  it('sets the provided target', () => {
    const config = createApiProxyConfig(TARGET);
    expect(config.target).toBe(TARGET);
  });

  it('uses a custom target when specified', () => {
    const config = createApiProxyConfig('http://localhost:9000');
    expect(config.target).toBe('http://localhost:9000');
  });

  it('sets changeOrigin to true', () => {
    const config = createApiProxyConfig(TARGET);
    expect(config.changeOrigin).toBe(true);
  });

  it('sets secure to false for local development', () => {
    const config = createApiProxyConfig(TARGET);
    expect(config.secure).toBe(false);
  });

  it('has a configure function for header forwarding and error handling', () => {
    const config = createApiProxyConfig(TARGET);
    expect(config.configure).toBeTypeOf('function');
  });

  describe('header forwarding', () => {
    function getProxyReqHandler(target: string = TARGET) {
      const config = createApiProxyConfig(target);
      const mockProxy = { on: vi.fn() };
      config.configure!(mockProxy as any, {} as any);
      return mockProxy.on.mock.calls.find(
        (call) => call[0] === 'proxyReq'
      )?.[1];
    }

    it('forwards Cookie header from request', () => {
      const handler = getProxyReqHandler();
      const mockProxyReq = { setHeader: vi.fn() };
      const mockReq = { headers: { cookie: 'session=abc123' } };

      handler(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith(
        'Cookie',
        'session=abc123'
      );
    });

    it('forwards Authorization header from request', () => {
      const handler = getProxyReqHandler();
      const mockProxyReq = { setHeader: vi.fn() };
      const mockReq = { headers: { authorization: 'Bearer token123' } };

      handler(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith(
        'Authorization',
        'Bearer token123'
      );
    });

    it('forwards both Cookie and Authorization when present', () => {
      const handler = getProxyReqHandler();
      const mockProxyReq = { setHeader: vi.fn() };
      const mockReq = {
        headers: { cookie: 'sid=x', authorization: 'Bearer y' },
      };

      handler(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).toHaveBeenCalledWith('Cookie', 'sid=x');
      expect(mockProxyReq.setHeader).toHaveBeenCalledWith(
        'Authorization',
        'Bearer y'
      );
    });

    it('does not set Cookie header when absent', () => {
      const handler = getProxyReqHandler();
      const mockProxyReq = { setHeader: vi.fn() };
      const mockReq = { headers: {} };

      handler(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).not.toHaveBeenCalledWith(
        'Cookie',
        expect.anything()
      );
    });

    it('does not set Authorization header when absent', () => {
      const handler = getProxyReqHandler();
      const mockProxyReq = { setHeader: vi.fn() };
      const mockReq = { headers: {} };

      handler(mockProxyReq, mockReq);

      expect(mockProxyReq.setHeader).not.toHaveBeenCalledWith(
        'Authorization',
        expect.anything()
      );
    });
  });

  describe('error handling', () => {
    function getErrorHandler(target: string = TARGET) {
      const config = createApiProxyConfig(target);
      const mockProxy = { on: vi.fn() };
      config.configure!(mockProxy as any, {} as any);
      return mockProxy.on.mock.calls.find(
        (call) => call[0] === 'error'
      )?.[1];
    }

    it('registers an error handler', () => {
      const config = createApiProxyConfig(TARGET);
      const mockProxy = { on: vi.fn() };
      config.configure!(mockProxy as any, {} as any);

      const errorCall = mockProxy.on.mock.calls.find(
        (call) => call[0] === 'error'
      );
      expect(errorCall).toBeDefined();
    });

    it('logs proxy error with request URL and target', () => {
      const handler = getErrorHandler();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      handler(new Error('ECONNREFUSED'), { url: '/api/expenses' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(
          'Proxy error: Could not proxy request /api/expenses'
        )
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('ECONNREFUSED')
      );
      consoleSpy.mockRestore();
    });

    it('includes target URL in error message', () => {
      const customTarget = 'http://localhost:9999';
      const handler = getErrorHandler(customTarget);
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      handler(new Error('timeout'), { url: '/api/users' });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining(customTarget)
      );
      consoleSpy.mockRestore();
    });
  });
});
