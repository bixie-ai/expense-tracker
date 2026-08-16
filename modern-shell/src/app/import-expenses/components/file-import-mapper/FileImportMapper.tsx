import { useEffect, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  InputLabel,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
} from '@mui/material';
import type { Expense } from '@/types/expense';
import {
  EXPENSE_PROPERTIES,
  NEGATIVE_AMOUNT_OPTIONS,
  createCsvMappingSchema,
  findDuplicateMappings,
  type CsvRow,
  type CsvMappingFormValues,
} from '../../utils/csv-validation';
import { useCsvMapper } from '../../hooks/useCsvMapper';

export interface FileImportMapperProps {
  file: File;
  csvData: CsvRow[];
  csvHeaders: string[];
  onPreviewData: (expenses: Expense[]) => void;
  onValidityChange: (isValid: boolean) => void;
}

export function FileImportMapper({
  file,
  csvData,
  csvHeaders,
  onPreviewData,
  onValidityChange,
}: FileImportMapperProps) {
  const schema = useMemo(() => createCsvMappingSchema(csvHeaders), [csvHeaders]);
  const { generateExpenses } = useCsvMapper({ csvData, fileName: file.name });

  const {
    control,
    watch,
    formState: { errors, isValid },
    trigger,
  } = useForm<CsvMappingFormValues>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    mode: 'onChange',
    defaultValues: {
      name: '',
      amount: '',
      date: '',
      category: '',
      type: '',
      comments: '',
      handleNegativeAmounts: '' as unknown as CsvMappingFormValues['handleNegativeAmounts'],
    },
  });

  const formValues = watch();
  const duplicateErrors = findDuplicateMappings(formValues);

  useEffect(() => {
    onValidityChange(isValid && Object.keys(duplicateErrors).length === 0);
  }, [isValid, duplicateErrors, onValidityChange]);

  useEffect(() => {
    if (isValid && Object.keys(duplicateErrors).length === 0) {
      const expenses = generateExpenses(formValues);
      onPreviewData(expenses);
    }
  }, [isValid, duplicateErrors, formValues, generateExpenses, onPreviewData]);

  const getFieldError = useCallback(
    (fieldName: string): string | undefined => {
      if (duplicateErrors[fieldName]) return duplicateErrors[fieldName];
      const fieldError = errors[fieldName as keyof CsvMappingFormValues];
      return fieldError?.message;
    },
    [duplicateErrors, errors]
  );

  return (
    <Box component="form" noValidate aria-label="CSV column mapping form">
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
          gap: 2,
          mb: 3,
        }}
      >
        {EXPENSE_PROPERTIES.map((prop) => {
          const error = getFieldError(prop.key);
          return (
            <FormControl key={prop.key} error={!!error} fullWidth>
              <InputLabel id={`label-${prop.key}`} required={prop.required}>
                Map {prop.label}
              </InputLabel>
              <Controller
                name={prop.key}
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    labelId={`label-${prop.key}`}
                    label={`Map ${prop.label}`}
                    aria-describedby={error ? `error-${prop.key}` : undefined}
                    onChange={(e) => {
                      field.onChange(e);
                      trigger();
                    }}
                  >
                    {!prop.required && (
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>
                    )}
                    {csvHeaders.map((header) => (
                      <MenuItem key={header} value={header}>
                        {header}
                      </MenuItem>
                    ))}
                  </Select>
                )}
              />
              {error && <FormHelperText id={`error-${prop.key}`}>{error}</FormHelperText>}
            </FormControl>
          );
        })}
      </Box>

      <FormControl
        error={!!errors.handleNegativeAmounts}
        component="fieldset"
      >
        <FormLabel component="legend" required>
          How to handle negative amounts?
        </FormLabel>
        <Controller
          name="handleNegativeAmounts"
          control={control}
          render={({ field }) => (
            <RadioGroup
              {...field}
              aria-label="How to handle negative amounts"
              onChange={(e) => {
                field.onChange(e);
                trigger();
              }}
            >
              {NEGATIVE_AMOUNT_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  value={option.value}
                  control={<Radio />}
                  label={option.label}
                />
              ))}
            </RadioGroup>
          )}
        />
        {errors.handleNegativeAmounts && (
          <FormHelperText>{errors.handleNegativeAmounts.message}</FormHelperText>
        )}
      </FormControl>
    </Box>
  );
}
