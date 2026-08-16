import { describe, it, expect } from 'vitest';
import { validateNewChip, chipOptionSchema, optionsListSchema } from '../optionsSchema';

describe('optionsSchema', () => {
  describe('chipOptionSchema', () => {
    it('should parse a valid chip option', () => {
      const result = chipOptionSchema.parse({ value: 'Food', removable: true });
      expect(result).toEqual({ value: 'Food', removable: true });
    });

    it('should trim whitespace from value', () => {
      const result = chipOptionSchema.parse({ value: '  Travel  ', removable: false });
      expect(result.value).toBe('Travel');
    });

    it('should reject empty value', () => {
      expect(() => chipOptionSchema.parse({ value: '', removable: true })).toThrow(
        'Option cannot be empty',
      );
    });

    it('should reject value exceeding 50 characters', () => {
      const longValue = 'a'.repeat(51);
      expect(() => chipOptionSchema.parse({ value: longValue, removable: true })).toThrow(
        'Option must be 50 characters or less',
      );
    });

    it('should accept value at exactly 50 characters', () => {
      const value = 'a'.repeat(50);
      const result = chipOptionSchema.parse({ value, removable: true });
      expect(result.value).toBe(value);
    });
  });

  describe('optionsListSchema', () => {
    it('should parse a valid list of unique options', () => {
      const input = [
        { value: 'Food', removable: false },
        { value: 'Travel', removable: true },
      ];
      const result = optionsListSchema.parse(input);
      expect(result).toHaveLength(2);
    });

    it('should reject list with duplicate values (case-insensitive)', () => {
      const input = [
        { value: 'Food', removable: false },
        { value: 'food', removable: true },
      ];
      expect(() => optionsListSchema.parse(input)).toThrow('Duplicate options are not allowed');
    });

    it('should accept empty list', () => {
      const result = optionsListSchema.parse([]);
      expect(result).toHaveLength(0);
    });
  });

  describe('validateNewChip', () => {
    const existing = ['Food', 'Travel', 'Shopping'];

    it('should return null for a valid new chip', () => {
      expect(validateNewChip('Entertainment', existing)).toBeNull();
    });

    it('should reject empty string', () => {
      expect(validateNewChip('', existing)).toBe('Option cannot be empty');
    });

    it('should reject whitespace-only string', () => {
      expect(validateNewChip('   ', existing)).toBe('Option cannot be empty');
    });

    it('should reject value exceeding 50 characters', () => {
      const longValue = 'a'.repeat(51);
      expect(validateNewChip(longValue, existing)).toBe(
        'Option must be 50 characters or less',
      );
    });

    it('should reject exact duplicate', () => {
      expect(validateNewChip('Food', existing)).toBe('This option already exists');
    });

    it('should reject case-insensitive duplicate', () => {
      expect(validateNewChip('food', existing)).toBe('This option already exists');
      expect(validateNewChip('TRAVEL', existing)).toBe('This option already exists');
    });

    it('should reject duplicate with surrounding whitespace', () => {
      expect(validateNewChip('  Food  ', existing)).toBe('This option already exists');
    });
  });
});
