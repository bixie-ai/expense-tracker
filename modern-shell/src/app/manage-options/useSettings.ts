import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { settingsRepository } from './settings.repository';
import { SettingsData } from './settings.d';
import { SettingsDataDto } from './optionsSchema';

export const settingsQueryKeys = {
  all: ['settings'] as const,
  detail: (userId: string) => [...settingsQueryKeys.all, userId] as const,
};

export function useSettings() {
  const { user } = useAuth();
  const userId = user?.uid ?? '';
  const queryClient = useQueryClient();

  const query = useQuery<SettingsData>({
    queryKey: settingsQueryKeys.detail(userId),
    queryFn: () => settingsRepository.getSettings(userId),
    enabled: !!userId,
  });

  const mutation = useMutation({
    mutationFn: ({ key, values }: { key: keyof SettingsDataDto; values: string[] }) =>
      settingsRepository.saveSettings(userId, key, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: settingsQueryKeys.detail(userId) });
    },
  });

  return {
    settings: query.data,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    saveSettings: mutation.mutate,
    saveSettingsAsync: mutation.mutateAsync,
    isSaving: mutation.isPending,
    saveError: mutation.error,
  };
}
