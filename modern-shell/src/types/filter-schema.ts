import { z } from 'zod';

export const TimeFrameValue = {
  CURRENT_MONTH: 'currentMonth',
  LAST_3_MONTHS: '3months',
  LAST_6_MONTHS: '6months',
  CUSTOM: 'custom range',
} as const;

export type TimeFrameValue = (typeof TimeFrameValue)[keyof typeof TimeFrameValue];

export const ExpenseEntryType = {
  MANUAL: 'manual',
  IMPORTED: 'imported',
} as const;

export type ExpenseEntryType = (typeof ExpenseEntryType)[keyof typeof ExpenseEntryType];

export const customDateRangeSchema = z
  .object({
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
  })
  .refine((data) => data.startDate <= data.endDate, {
    message: 'Start date must be before or equal to end date',
    path: ['startDate'],
  });

export const expenseFilterSchema = z.object({
  timeFrame: z
    .enum([
      TimeFrameValue.CURRENT_MONTH,
      TimeFrameValue.LAST_3_MONTHS,
      TimeFrameValue.LAST_6_MONTHS,
      TimeFrameValue.CUSTOM,
    ])
    .nullable(),
  entryType: z.enum([ExpenseEntryType.MANUAL, ExpenseEntryType.IMPORTED]).nullable(),
  startDate: z.date().nullable(),
  endDate: z.date().nullable(),
});

export type ExpenseFilterFormValues = z.infer<typeof expenseFilterSchema>;

export type CustomDateRange = z.infer<typeof customDateRangeSchema>;

export interface TimeFrameOption {
  label: string;
  value: TimeFrameValue;
}

export interface EntryTypeOption {
  label: string;
  value: ExpenseEntryType;
}

export const TIME_FRAME_OPTIONS: TimeFrameOption[] = [
  { label: 'Current Month', value: TimeFrameValue.CURRENT_MONTH },
  { label: 'Last 3 Months', value: TimeFrameValue.LAST_3_MONTHS },
  { label: 'Last 6 Months', value: TimeFrameValue.LAST_6_MONTHS },
  { label: 'Custom Date Range', value: TimeFrameValue.CUSTOM },
];

export const ENTRY_TYPE_OPTIONS: EntryTypeOption[] = [
  { label: 'Manual Entry', value: ExpenseEntryType.MANUAL },
  { label: 'Imported', value: ExpenseEntryType.IMPORTED },
];

export function getDateRangeForTimeFrame(
  timeFrame: TimeFrameValue,
): { start: Date; end: Date } | null {
  const today = new Date();
  switch (timeFrame) {
    case TimeFrameValue.CURRENT_MONTH:
      return {
        start: new Date(today.getFullYear(), today.getMonth(), 1),
        end: today,
      };
    case TimeFrameValue.LAST_3_MONTHS: {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 2, 1);
      return { start, end: today };
    }
    case TimeFrameValue.LAST_6_MONTHS: {
      const start = new Date(today);
      start.setMonth(start.getMonth() - 5, 1);
      return { start, end: today };
    }
    case TimeFrameValue.CUSTOM:
      return null;
  }
}
