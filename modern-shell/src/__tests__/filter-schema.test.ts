import { describe, it, expect } from 'vitest';
import {
  customDateRangeSchema,
  expenseFilterSchema,
  getDateRangeForTimeFrame,
  TimeFrameValue,
} from '../types/filter-schema';

describe('filter-schema', () => {
  describe('customDateRangeSchema', () => {
    it('should validate when startDate is before endDate', () => {
      const result = customDateRangeSchema.safeParse({
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-03-31'),
      });
      expect(result.success).toBe(true);
    });

    it('should validate when startDate equals endDate', () => {
      const result = customDateRangeSchema.safeParse({
        startDate: new Date('2024-03-15'),
        endDate: new Date('2024-03-15'),
      });
      expect(result.success).toBe(true);
    });

    it('should reject when startDate is after endDate', () => {
      const result = customDateRangeSchema.safeParse({
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-01-01'),
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Start date must be before or equal to end date');
      }
    });

    it('should coerce string dates to Date objects', () => {
      const result = customDateRangeSchema.safeParse({
        startDate: '2024-01-01',
        endDate: '2024-12-31',
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.startDate).toBeInstanceOf(Date);
        expect(result.data.endDate).toBeInstanceOf(Date);
      }
    });

    it('should reject invalid date strings', () => {
      const result = customDateRangeSchema.safeParse({
        startDate: 'not-a-date',
        endDate: '2024-12-31',
      });
      expect(result.success).toBe(false);
    });
  });

  describe('expenseFilterSchema', () => {
    it('should validate with all null values', () => {
      const result = expenseFilterSchema.safeParse({
        timeFrame: null,
        entryType: null,
        startDate: null,
        endDate: null,
      });
      expect(result.success).toBe(true);
    });

    it('should validate with a valid time frame', () => {
      const result = expenseFilterSchema.safeParse({
        timeFrame: 'currentMonth',
        entryType: null,
        startDate: new Date('2024-03-01'),
        endDate: new Date('2024-03-31'),
      });
      expect(result.success).toBe(true);
    });

    it('should validate with a valid entry type', () => {
      const result = expenseFilterSchema.safeParse({
        timeFrame: null,
        entryType: 'imported',
        startDate: null,
        endDate: null,
      });
      expect(result.success).toBe(true);
    });

    it('should reject invalid time frame values', () => {
      const result = expenseFilterSchema.safeParse({
        timeFrame: 'invalid',
        entryType: null,
        startDate: null,
        endDate: null,
      });
      expect(result.success).toBe(false);
    });

    it('should reject invalid entry type values', () => {
      const result = expenseFilterSchema.safeParse({
        timeFrame: null,
        entryType: 'invalid',
        startDate: null,
        endDate: null,
      });
      expect(result.success).toBe(false);
    });
  });

  describe('getDateRangeForTimeFrame', () => {
    it('should return current month start to today for CURRENT_MONTH', () => {
      const result = getDateRangeForTimeFrame(TimeFrameValue.CURRENT_MONTH);
      expect(result).not.toBeNull();
      expect(result!.start.getDate()).toBe(1);
      expect(result!.start.getMonth()).toBe(new Date().getMonth());
      expect(result!.end.toDateString()).toBe(new Date().toDateString());
    });

    it('should return 3-month range for LAST_3_MONTHS', () => {
      const result = getDateRangeForTimeFrame(TimeFrameValue.LAST_3_MONTHS);
      expect(result).not.toBeNull();
      const today = new Date();
      const expectedMonth = today.getMonth() - 2;
      const normalizedMonth = expectedMonth < 0 ? expectedMonth + 12 : expectedMonth;
      expect(result!.start.getMonth()).toBe(normalizedMonth);
      expect(result!.start.getDate()).toBe(1);
    });

    it('should return 6-month range for LAST_6_MONTHS', () => {
      const result = getDateRangeForTimeFrame(TimeFrameValue.LAST_6_MONTHS);
      expect(result).not.toBeNull();
      const today = new Date();
      const expectedMonth = today.getMonth() - 5;
      const normalizedMonth = expectedMonth < 0 ? expectedMonth + 12 : expectedMonth;
      expect(result!.start.getMonth()).toBe(normalizedMonth);
      expect(result!.start.getDate()).toBe(1);
    });

    it('should return null for CUSTOM', () => {
      const result = getDateRangeForTimeFrame(TimeFrameValue.CUSTOM);
      expect(result).toBeNull();
    });
  });
});
