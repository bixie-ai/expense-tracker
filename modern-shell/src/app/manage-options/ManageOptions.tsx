import { useState, useRef, KeyboardEvent } from 'react';
import {
  Card,
  CardContent,
  CardActions,
  CardHeader,
  Chip,
  TextField,
  Button,
  CircularProgress,
  Box,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { useSettings } from './useSettings';
import { useNotification } from '@/components/shared/NotificationProvider';
import { validateNewChip } from './optionsSchema';
import { ChipOption, ManageOptionsProps, SettingsData } from './settings.d';

const DEFAULT_CATEGORIES = [
  'Food',
  'Transport',
  'Shopping',
  'Entertainment',
  'Bills',
  'Health',
  'Education',
  'Travel',
  'Other',
];

const DEFAULT_TYPES = ['Manual', 'Import'];

const DEFAULTS: Record<keyof SettingsData, string[]> = {
  categories: DEFAULT_CATEGORIES,
  types: DEFAULT_TYPES,
};

function buildChipOptions(values: string[], settingsKey: keyof SettingsData): ChipOption[] {
  const defaults = DEFAULTS[settingsKey];
  return values.map((v) => ({
    value: v,
    removable: !defaults.includes(v),
  }));
}

export function ManageOptions({ title, subtitle, label, placeholder, settingsKey }: ManageOptionsProps) {
  const { settings, isLoading, saveSettingsAsync, isSaving } = useSettings();
  const { showSuccess, showError } = useNotification();
  const inputRef = useRef<HTMLInputElement>(null);

  const serverValues = settings?.[settingsKey] ?? [];
  const [draftChips, setDraftChips] = useState<ChipOption[] | null>(null);
  const [inputValue, setInputValue] = useState('');

  const chips = draftChips ?? buildChipOptions(serverValues, settingsKey);
  const chipValues = chips.map((c) => c.value);

  const isDirty =
    draftChips !== null &&
    (draftChips.length !== serverValues.length ||
      draftChips.some((c, i) => c.value !== serverValues[i]));

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const error = validateNewChip(inputValue, chipValues);
    if (error) return;

    const trimmed = inputValue.trim();
    setDraftChips([...chips, { value: trimmed, removable: true }]);
    setInputValue('');
  }

  function handleRemove(chipValue: string) {
    setDraftChips(chips.filter((c) => c.value !== chipValue));
  }

  function handleReset() {
    setDraftChips(null);
    setInputValue('');
  }

  async function handleSave() {
    const values = chips.map((c) => c.value);
    try {
      await saveSettingsAsync({ key: settingsKey, values });
      setDraftChips(null);
      showSuccess(`${title} saved!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save settings';
      showError(message);
    }
  }

  if (isLoading) {
    return (
      <Card variant="outlined">
        <CardHeader title={title} subheader={subtitle} />
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress aria-label="Loading settings" />
          </Box>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="outlined">
      <CardHeader title={title} subheader={subtitle} />
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 1,
            mb: 2,
            p: 1,
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 1,
            minHeight: 48,
          }}
          role="list"
          aria-label={`${label} list`}
        >
          {chips.map((chip) => (
            <Chip
              key={chip.value}
              label={chip.value}
              role="listitem"
              onDelete={chip.removable ? () => handleRemove(chip.value) : undefined}
              aria-label={chip.removable ? `${chip.value}, press delete to remove` : chip.value}
            />
          ))}
        </Box>
        <TextField
          inputRef={inputRef}
          fullWidth
          label={label}
          placeholder={placeholder}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          size="small"
          slotProps={{
            htmlInput: {
              'aria-label': `Add new ${label.toLowerCase()}`,
            },
          }}
        />
      </CardContent>
      <CardActions sx={{ justifyContent: 'flex-end', px: 2, pb: 2 }}>
        <Button onClick={handleReset} disabled={!isDirty}>
          Reset
        </Button>
        <Button
          variant="outlined"
          startIcon={isSaving ? <CircularProgress size={16} /> : <SaveIcon />}
          onClick={handleSave}
          disabled={!isDirty || isSaving}
          aria-busy={isSaving}
        >
          Save
        </Button>
      </CardActions>
    </Card>
  );
}
