export interface ChipOption {
  value: string;
  removable: boolean;
}

export interface SettingsData {
  categories: string[];
  types: string[];
}

export interface ManageOptionsProps {
  title: string;
  subtitle: string;
  label: string;
  placeholder: string;
  settingsKey: keyof SettingsData;
}
