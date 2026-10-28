import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expenseRepository } from '../expense.repository';
import { ExpenseDto, ExpenseInputDto } from '../../api/schemas';

vi.mock('../../config/firebase', () => ({
  database: { ref: vi.fn() },
}));

vi.mock('firebase/database', () => ({
  ref: vi.fn(() => 'mock-ref'),
  get: vi.fn(),
  push: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

const { ref, get, push, update, remove } = await vi.importActual('firebase/database') as any;

describe('ExpenseRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getByUser', () => {
    it('should return empty array when no expenses exist', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockResolvedValue({ exists: () => false, val: () => null } as any);

      const result = await expenseRepository.getByUser('user1');
      expect(result).toEqual([]);
    });

    it('should return validated expenses with ids', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({
          'exp-1': { name: 'Test', amount: 10, date: '2024-01-01', category: 'Food', type: 'Manual' },
          'exp-2': { name: 'Test2', amount: 20, date: '2024-01-02', category: 'Transport', type: 'Manual' },
        }),
      } as any);

      const result = await expenseRepository.getByUser('user1');
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('exp-1');
      expect(result[1].id).toBe('exp-2');
    });

    it('should throw on invalid data', async () => {
      const mockGet = vi.mocked(get);
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({
          'exp-1': { name: 123, amount: 'invalid' },
        }),
      } as any);

      await expect(expenseRepository.getByUser('user1')).rejects.toThrow();
    });
  });

  describe('create', () => {
    it('should validate input and push to Firebase', async () => {
      const mockPush = vi.mocked(push);
      mockPush.mockResolvedValue({ key: 'new-expense-id' } as any);

      const expense: ExpenseInputDto = {
        name: 'Lunch',
        amount: 12.5,
        date: '2024-03-15',
        category: 'Food',
        type: 'Manual',
        comments: '',
      };

      const result = await expenseRepository.create('user1', expense);

      expect(result).toHaveProperty('id', 'new-expense-id');
      expect(result.name).toBe('Lunch');
      expect(result.amount).toBe(12.5);
    });

    it('should reject invalid expense input', async () => {
      const invalidExpense = { name: 123, amount: 'invalid' } as never;
      await expect(expenseRepository.create('user1', invalidExpense)).rejects.toThrow();
    });

    // T44: create validates required fields
    it('should reject expense input missing name', async () => {
      const invalid = { date: '2024-01-01', category: 'Food', type: 'expense', amount: 10 } as never;
      await expect(expenseRepository.create('user1', invalid)).rejects.toThrow();
    });

    it('should reject expense input missing amount', async () => {
      const invalid = { name: 'Test', date: '2024-01-01', category: 'Food', type: 'expense' } as never;
      await expect(expenseRepository.create('user1', invalid)).rejects.toThrow();
    });

    it('should reject expense input missing date', async () => {
      const invalid = { name: 'Test', category: 'Food', type: 'expense', amount: 10 } as never;
      await expect(expenseRepository.create('user1', invalid)).rejects.toThrow();
    });

    it('should reject expense input missing category', async () => {
      const invalid = { name: 'Test', date: '2024-01-01', type: 'expense', amount: 10 } as never;
      await expect(expenseRepository.create('user1', invalid)).rejects.toThrow();
    });

    it('should reject expense input missing type', async () => {
      const invalid = { name: 'Test', date: '2024-01-01', category: 'Food', amount: 10 } as never;
      await expect(expenseRepository.create('user1', invalid)).rejects.toThrow();
    });

    // T45: create validates amount is positive
    it('should reject negative amount', async () => {
      const invalid = { name: 'Test', date: '2024-01-01', category: 'Food', type: 'expense', amount: -5 };
      await expect(expenseRepository.create('user1', invalid)).rejects.toThrow();
    });

    it('should reject zero amount', async () => {
      const invalid = { name: 'Test', date: '2024-01-01', category: 'Food', type: 'expense', amount: 0 };
      await expect(expenseRepository.create('user1', invalid)).rejects.toThrow();
    });
  });

  describe('update', () => {
    it('should validate and update', async () => {
      const mockUpdate = vi.mocked(update);
      mockUpdate.mockResolvedValue(undefined);

      const expense: ExpenseInputDto = { name: 'Updated', amount: 50 };
      await expenseRepository.update('user1', 'exp-1', expense as never);
      expect(mockUpdate).toHaveBeenCalledWith('mock-ref', expense);
    });

    it('should reject invalid input', async () => {
      const invalid = { name: 123, amount: 'invalid' } as never;
      await expect(expenseRepository.update('user1', 'exp-1', invalid)).rejects.toThrow();
    });

    // T46: update preserves existing fields
    it('should only update provided fields', async () => {
      const expense = { name: 'Updated Name', amount: 50 };
      const mockUpdate = vi.mocked(update);
      mockUpdate.mockResolvedValue(undefined);

      await expenseRepository.update('user1', 'exp-1', expense as never);
      expect(mockUpdate).toHaveBeenCalledWith('mock-ref', expense);
    });
  });

  describe('delete', () => {
    it('should remove expense from Firebase', async () => {
      const mockRemove = vi.mocked(remove);
      mockRemove.mockResolvedValue(undefined);

      await expenseRepository.delete('user1', 'exp-1');
      expect(mockRemove).toHaveBeenCalledWith('mock-ref');
    });
  });
});
