import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

const mockGetIdToken = vi.fn();
const mockSignOut = vi.fn();

vi.mock('../../config/firebase', () => ({
  auth: {
    currentUser: { getIdToken: () => mockGetIdToken() },
    signOut: () => mockSignOut(),
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should create an axios instance with correct defaults', async () => {
    const { apiClient } = await import('../api/client');
    expect(apiClient).toBeDefined();
    expect(apiClient.defaults.timeout).toBe(10000);
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should have request and response interceptors registered', async () => {
    const { apiClient } = await import('../api/client');
    expect(apiClient.interceptors.request).toBeDefined();
    expect(apiClient.interceptors.response).toBeDefined();
  });

  it('should attach auth token via request interceptor', async () => {
    mockGetIdToken.mockResolvedValue('test-token-abc');
    const { apiClient } = await import('../api/client');

    const interceptors = (apiClient.interceptors.request as unknown as { handlers: Array<{ fulfilled: (config: unknown) => unknown }> }).handlers;
    const requestInterceptor = interceptors[0].fulfilled;

    const config = { headers: {} } as unknown as InternalAxiosRequestConfig;
    const result = await requestInterceptor(config);
    expect((result as { headers: { Authorization: string } }).headers.Authorization).toBe('Bearer test-token-abc');
  });

  it('should call signOut on 401 response', async () => {
    const { apiClient } = await import('../api/client');

    const interceptors = (apiClient.interceptors.response as unknown as { handlers: Array<{ rejected: (error: unknown) => unknown }> }).handlers;
    const errorHandler = interceptors[0].rejected;

    const error = { response: { status: 401 } };
    await expect(errorHandler(error)).rejects.toEqual(error);
    expect(mockSignOut).toHaveBeenCalled();
  });

  it('should not call signOut on non-401 response', async () => {
    const { apiClient } = await import('../api/client');

    const interceptors = (apiClient.interceptors.response as unknown as { handlers: Array<{ rejected: (error: unknown) => unknown }> }).handlers;
    const errorHandler = interceptors[0].rejected;

    const error = { response: { status: 500 } };
    await expect(errorHandler(error)).rejects.toEqual(error);
    expect(mockSignOut).not.toHaveBeenCalled();
  });
});
