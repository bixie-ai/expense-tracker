import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockGet = vi.fn();
const mockSet = vi.fn();
const mockRef = vi.fn((_db: unknown, path: string) => path);

vi.mock('firebase/database', () => ({
  ref: (db: unknown, path: string) => mockRef(db, path),
  get: (refPath: string) => mockGet(refPath),
  set: (refPath: string, value: unknown) => mockSet(refPath, value),
}));

vi.mock('@/config/firebase', () => ({
  database: 'mock-database',
}));

import { SettingsRepository } from '../settings.repository';

describe('SettingsRepository', () => {
  let repository: SettingsRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    repository = new SettingsRepository();
  });

  describe('getSettings', () => {
    it('should return default categories and types when no data exists', async () => {
      mockGet.mockResolvedValue({ exists: () => false });

      const result = await repository.getSettings('user-123');

      expect(result).toEqual({
        categories: [
          'Food',
          'Transport',
          'Shopping',
          'Entertainment',
          'Bills',
          'Health',
          'Education',
          'Travel',
          'Other',
        ],
        types: ['Manual', 'Import'],
      });
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user-123');
    });

    it('should return SettingsData shape with categories and types arrays', async () => {
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({
          categories: { 0: 'Groceries', 1: 'Rent' },
          types: { 0: 'Card', 1: 'Cash' },
        }),
      });

      const result = await repository.getSettings('user-456');

      expect(result).toHaveProperty('categories');
      expect(result).toHaveProperty('types');
      expect(Array.isArray(result.categories)).toBe(true);
      expect(Array.isArray(result.types)).toBe(true);
      expect(result.categories).toEqual(['Groceries', 'Rent']);
      expect(result.types).toEqual(['Card', 'Cash']);
    });

    it('should return defaults for empty categories/types objects', async () => {
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ categories: {}, types: {} }),
      });

      const result = await repository.getSettings('user-789');

      expect(result.categories).toEqual([
        'Food',
        'Transport',
        'Shopping',
        'Entertainment',
        'Bills',
        'Health',
        'Education',
        'Travel',
        'Other',
      ]);
      expect(result.types).toEqual(['Manual', 'Import']);
    });

    it('should handle missing categories key with defaults', async () => {
      mockGet.mockResolvedValue({
        exists: () => true,
        val: () => ({ types: { 0: 'Wire' } }),
      });

      const result = await repository.getSettings('user-abc');

      expect(result.categories).toEqual([
        'Food',
        'Transport',
        'Shopping',
        'Entertainment',
        'Bills',
        'Health',
        'Education',
        'Travel',
        'Other',
      ]);
      expect(result.types).toEqual(['Wire']);
    });
  });

  describe('saveSettings', () => {
    it('should save categories and return the saved values', async () => {
      mockSet.mockResolvedValue(undefined);
      const values = ['Food', 'Travel', 'Shopping'];

      const result = await repository.saveSettings('user-123', 'categories', values);

      expect(result).toEqual(['Food', 'Travel', 'Shopping']);
      expect(Array.isArray(result)).toBe(true);
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user-123/categories');
      expect(mockSet).toHaveBeenCalledWith('users/user-123/categories', values);
    });

    it('should save types and return the saved values', async () => {
      mockSet.mockResolvedValue(undefined);
      const values = ['Card', 'Cash', 'Transfer'];

      const result = await repository.saveSettings('user-456', 'types', values);

      expect(result).toEqual(['Card', 'Cash', 'Transfer']);
      expect(Array.isArray(result)).toBe(true);
      expect(mockRef).toHaveBeenCalledWith('mock-database', 'users/user-456/types');
      expect(mockSet).toHaveBeenCalledWith('users/user-456/types', values);
    });

    it('should return string[] shape matching SettingsData field type', async () => {
      mockSet.mockResolvedValue(undefined);
      const values = ['A', 'B'];

      const result = await repository.saveSettings('user-x', 'categories', values);

      expect(result).toStrictEqual(values);
      result.forEach((item) => {
        expect(typeof item).toBe('string');
      });
    });
  });
});
