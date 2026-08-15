import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UserRepository } from '../repositories/user.repository';

const mockGet = vi.fn();
const mockUpdate = vi.fn();
const mockRef = vi.fn();

vi.mock('firebase/database', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  get: (...args: unknown[]) => mockGet(...args),
  update: (...args: unknown[]) => mockUpdate(...args),
}));

vi.mock('../../config/firebase', () => ({
  database: 'mock-database',
}));

describe('UserRepository', () => {
  let repository: UserRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new UserRepository();
    mockRef.mockReturnValue('mock-ref');
  });

  describe('get', () => {
    it('should return null when user does not exist', async () => {
      mockGet.mockResolvedValue({ exists: () => false });

      const result = await repository.get('user1');
      expect(result).toBeNull();
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user1');
    });

    it('should return validated user details', async () => {
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com' }),
      });

      const result = await repository.get('user1');
      expect(result).toEqual({ firstName: 'Jane', lastName: 'Smith' });
    });

    it('should handle missing firstName/lastName with defaults', async () => {
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ email: 'user@test.com' }),
      });

      const result = await repository.get('user1');
      expect(result).toEqual({ firstName: '', lastName: '' });
    });
  });

  describe('update', () => {
    it('should validate and update user details in Firebase', async () => {
      const details = { firstName: 'John', lastName: 'Doe' };
      mockUpdate.mockResolvedValue(undefined);

      const result = await repository.update('user1', details);
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user1');
      expect(mockUpdate).toHaveBeenCalledWith('mock-ref', details);
      expect(result).toEqual(details);
    });

    it('should reject invalid user details', async () => {
      const invalid = { firstName: 123 } as never;
      await expect(repository.update('user1', invalid)).rejects.toThrow();
    });

    it('should reject missing lastName', async () => {
      const invalid = { firstName: 'John' } as never;
      await expect(repository.update('user1', invalid)).rejects.toThrow();
    });
  });
});
