import { z } from 'zod';

export const chipOptionSchema = z.object({
  value: z
    .string()
    .min(1, 'Option cannot be empty')
    .max(50, 'Option must be 50 characters or less')
    .transform((v) => v.trim()),
  removable: z.boolean(),
});

export type ChipOptionInput = z.infer<typeof chipOptionSchema>;

export const optionsListSchema = z
  .array(chipOptionSchema)
  .refine(
    (items) => {
      const values = items.map((i) => i.value.toLowerCase());
      return new Set(values).size === values.length;
    },
    { message: 'Duplicate options are not allowed' },
  );

export const settingsDataSchema = z.object({
  categories: z.array(z.string()),
  types: z.array(z.string()),
});

export type SettingsDataDto = z.infer<typeof settingsDataSchema>;

export function validateNewChip(value: string, existing: string[]): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return 'Option cannot be empty';
  }
  if (trimmed.length > 50) {
    return 'Option must be 50 characters or less';
  }
  const isDuplicate = existing.some((e) => e.toLowerCase() === trimmed.toLowerCase());
  if (isDuplicate) {
    return 'This option already exists';
  }
  return null;
}
