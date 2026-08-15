import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ExpenseRepository } from '../repositories/expense.repository';

const mockGet = vi.fn();
const mockPush = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockRef = vi.fn();

vi.mock('firebase/database', () => ({
  ref: (...args: unknown[]) => mockRef(...args),
  get: (...args: unknown[]) => mockGet(...args),
  push: (...args: unknown[]) => mockPush(...args),
  update: (...args: unknown[]) => mockUpdate(...args),
  remove: (...args: unknown[]) => mockRemove(...args),
}));

vi.mock('../../config/firebase', () => ({
  database: 'mock-database',
}));

describe('ExpenseRepository', () => {
  let repository: ExpenseRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new ExpenseRepository();
    mockRef.mockReturnValue('mock-ref');
  });

  describe('getByUser', () => {
    it('should return empty array when no expenses exist', async () => {
      mockGet.mockResolvedValue({ exists: () => false });

      const result = await repository.getByUser('user1');
      expect(result).toEqual([]);
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user1/expenses');
    });

    it('should return validated expenses with ids', async () => {
      const firebaseData = {
        key1: { name: 'Lunch', date: '2024-01-15', category: 'Food', type: 'expense', amount: 25 },
        key2: { name: 'Taxi', date: '2024-01-16', category: 'Transport', type: 'expense', amount: 15 },
      };
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => firebaseData,
      });

      const result = await repository.getByUser('user1');
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({ id: 'key1', name: 'Lunch', date: '2024-01-15', category: 'Food', type: 'expense', amount: 25 });
      expect(result[1]).toEqual({ id: 'key2', name: 'Taxi', date: '2024-01-16', category: 'Transport', type: 'expense', amount: 15 });
    });

    it('should throw on invalid data from Firebase', async () => {
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ key1: { invalid: 'data' } }),
      });

      await expect(repository.getByUser('user1')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should validate input and push to Firebase', async () => {
      const expense = { name: 'Coffee', date: '2024-03-01', category: 'Drinks', type: 'expense', amount: 5 };
      mockPush.mockResolvedValue({ key: 'new-key-1' });

      const result = await repository.create('user1', expense);
      expect(mockPush).toHaveBeenCalledWith('mock-ref', expense);
      expect(result).toEqual({ ...expense, id: 'new-key-1' });
    });

    it('should reject invalid expense input', async () => {
      const invalid = { name: 'Bad', date: '2024-01-01' } as never;
      await expect(repository.create('user1', invalid)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should validate and update expense in Firebase', async () => {
      const expense = { name: 'Updated', date: '2024-04-01', category: 'Food', type: 'expense', amount: 30 };
      mockUpdate.mockResolvedValue(undefined);

      const result = await repository.update('user1', 'exp-1', expense);
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user1/expenses/exp-1');
      expect(mockUpdate).toHaveBeenCalledWith('mock-ref', expense);
      expect(result).toEqual({ ...expense, id: 'exp-1' });
    });

    it('should reject invalid expense input on update', async () => {
      const invalid = { name: 123 } as never;
      await expect(repository.update('user1', 'exp-1', invalid)).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should remove expense from Firebase', async () => {
      mockRemove.mockResolvedValue(undefined);

      await repository.delete('user1', 'exp-1');
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user1/expenses/exp-1');
      expect(mockRemove).toHaveBeenCalledWith('mock-ref');
    });
  });
});
