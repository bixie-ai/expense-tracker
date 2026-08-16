import { ref, get, set } from 'firebase/database';
import { database } from '@/config/firebase';
import { settingsDataSchema, SettingsDataDto } from './optionsSchema';
import { SettingsData } from './settings.d';

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

export class SettingsRepository {
  private basePath(userId: string) {
    return `users/${userId}`;
  }

  async getSettings(userId: string): Promise<SettingsData> {
    const snapshot = await get(ref(database, this.basePath(userId)));
    if (!snapshot.exists()) {
      return { categories: DEFAULT_CATEGORIES, types: DEFAULT_TYPES };
    }

    const data = snapshot.val();
    const categoriesRaw = data.categories ?? {};
    const typesRaw = data.types ?? {};

    const categories = Object.keys(categoriesRaw).length
      ? Object.values<string>(categoriesRaw)
      : DEFAULT_CATEGORIES;
    const types = Object.keys(typesRaw).length
      ? Object.values<string>(typesRaw)
      : DEFAULT_TYPES;

    return settingsDataSchema.parse({ categories, types });
  }

  async saveSettings(
    userId: string,
    key: keyof SettingsDataDto,
    values: string[],
  ): Promise<string[]> {
    const path = `${this.basePath(userId)}/${key}`;
    await set(ref(database, path), values);
    return values;
  }
}

export const settingsRepository = new SettingsRepository();
