import { Box, Card, CardContent, Chip, TextField, Typography } from '@mui/material';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { useState } from 'react';
import {
  TIME_FRAME_OPTIONS,
  ENTRY_TYPE_OPTIONS,
  TimeFrameValue,
  ExpenseEntryType,
} from '../../types/filter-schema';
import { UseExpenseFiltersReturn } from '../../hooks/filters/useExpenseFilters';

export interface ExpenseFilterControlsProps {
  filters: UseExpenseFiltersReturn;
  hasExpenses: boolean;
  hasImportedFiles: boolean;
}

export function ExpenseFilterControls({
  filters,
  hasExpenses,
  hasImportedFiles,
}: ExpenseFilterControlsProps) {
  const [showFilters, setShowFilters] = useState(false);
  const { form, isCustomRange, selectTimeFrame, selectEntryType } = filters;
  const timeFrame = form.watch('timeFrame');
  const entryType = form.watch('entryType');

  if (!hasExpenses) return null;

  const handleTimeFrameClick = (value: TimeFrameValue) => {
    if (timeFrame === value) {
      selectTimeFrame(null);
    } else {
      selectTimeFrame(value);
    }
  };

  const handleEntryTypeClick = (value: ExpenseEntryType) => {
    if (entryType === value) {
      selectEntryType(null);
    } else {
      selectEntryType(value);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
        <Chip
          icon={showFilters ? <FilterAltIcon /> : <FilterAltOffIcon />}
          label={`Filters ${timeFrame ? 'On' : 'Off'}`}
          onClick={() => setShowFilters((prev) => !prev)}
          variant="outlined"
          aria-label="Toggle filters"
        />
      </Box>

      {showFilters && (
        <Box sx={{ mt: 1 }}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
                Time Frame
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }} role="group" aria-label="Time frame filters">
                {TIME_FRAME_OPTIONS.map((option) => (
                  <Chip
                    key={option.value}
                    label={option.label}
                    color={timeFrame === option.value ? 'primary' : 'default'}
                    variant={timeFrame === option.value ? 'filled' : 'outlined'}
                    onClick={() => handleTimeFrameClick(option.value)}
                    aria-pressed={timeFrame === option.value}
                  />
                ))}
              </Box>

              {isCustomRange && (
                <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }} role="group" aria-label="Custom date range">
                  <TextField
                    label="Start Date"
                    type="date"
                    size="small"
                    value={formatDateForInput(form.watch('startDate'))}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
                      form.setValue('startDate', date);
                    }}
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!form.formState.errors.startDate}
                    helperText={form.formState.errors.startDate?.message}
                  />
                  <TextField
                    label="End Date"
                    type="date"
                    size="small"
                    value={formatDateForInput(form.watch('endDate'))}
                    onChange={(e) => {
                      const date = e.target.value ? new Date(e.target.value + 'T00:00:00') : null;
                      form.setValue('endDate', date);
                    }}
                    slotProps={{ inputLabel: { shrink: true } }}
                    error={!!form.formState.errors.endDate}
                    helperText={form.formState.errors.endDate?.message}
                  />
                </Box>
              )}

              {hasImportedFiles && (
                <>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }} gutterBottom>
                    Expense Entry Type
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }} role="group" aria-label="Entry type filters">
                    {ENTRY_TYPE_OPTIONS.map((option) => (
                      <Chip
                        key={option.value}
                        label={option.label}
                        color={entryType === option.value ? 'primary' : 'default'}
                        variant={entryType === option.value ? 'filled' : 'outlined'}
                        onClick={() => handleEntryTypeClick(option.value)}
                        aria-pressed={entryType === option.value}
                      />
                    ))}
                  </Box>
                </>
              )}
            </CardContent>
          </Card>
        </Box>
      )}
    </Box>
  );
}

function formatDateForInput(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
