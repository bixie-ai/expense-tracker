import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useUserDetails } from '../hooks/useUserDetails';

const mockGet = vi.fn();
const mockUpdate = vi.fn();

vi.mock('../repositories/user.repository', () => ({
  userRepository: {
    get: (...args: unknown[]) => mockGet(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'test-user-123' } }),
}));

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe('useUserDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch user details for the authenticated user', async () => {
    const details = { firstName: 'Jane', lastName: 'Smith' };
    mockGet.mockResolvedValue(details);

    const { result } = renderHook(() => useUserDetails(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(details);
    expect(mockGet).toHaveBeenCalledWith('test-user-123');
  });

  it('should use provided userId over auth context', async () => {
    mockGet.mockResolvedValue(null);

    const { result } = renderHook(() => useUserDetails('custom-user'), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockGet).toHaveBeenCalledWith('custom-user');
  });

  it('should handle null response when user not found', async () => {
    mockGet.mockResolvedValue(null);

    const { result } = renderHook(() => useUserDetails(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toBeNull();
  });

  it('should update user details and invalidate the query', async () => {
    mockGet.mockResolvedValue({ firstName: 'Jane', lastName: 'Smith' });
    const updatedDetails = { firstName: 'Jane', lastName: 'Doe' };
    mockUpdate.mockResolvedValue(updatedDetails);

    const { result } = renderHook(() => useUserDetails(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      result.current.updateUserDetails.mutate(updatedDetails);
    });

    await waitFor(() => expect(result.current.updateUserDetails.isSuccess).toBe(true));
    expect(mockUpdate).toHaveBeenCalledWith('test-user-123', updatedDetails);
  });

  it('should handle fetch error', async () => {
    mockGet.mockRejectedValue(new Error('Permission denied'));

    const { result } = renderHook(() => useUserDetails(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });

  it('should handle mutation error', async () => {
    mockGet.mockResolvedValue({ firstName: 'Jane', lastName: 'Smith' });
    mockUpdate.mockRejectedValue(new Error('Update failed'));

    const { result } = renderHook(() => useUserDetails(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    await act(async () => {
      result.current.updateUserDetails.mutate({ firstName: 'X', lastName: 'Y' });
    });

    await waitFor(() => expect(result.current.updateUserDetails.isError).toBe(true));
  });
});
