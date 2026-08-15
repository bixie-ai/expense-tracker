import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { userRepository } from '../repositories/user.repository';
import { UserDetailsDto } from '../api/schemas';

export const userDetailsQueryKeys = {
  all: ['userDetails'] as const,
  detail: (userId: string) => [...userDetailsQueryKeys.all, userId] as const,
};

export function useUserDetails(userId?: string) {
  const { user } = useAuth();
  const resolvedUserId = userId ?? user?.uid ?? '';
  const queryClient = useQueryClient();

  const query = useQuery<UserDetailsDto | null>({
    queryKey: userDetailsQueryKeys.detail(resolvedUserId),
    queryFn: () => userRepository.get(resolvedUserId),
    enabled: !!resolvedUserId,
  });

  const updateMutation = useMutation({
    mutationFn: (userDetails: UserDetailsDto) =>
      userRepository.update(resolvedUserId, userDetails),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: userDetailsQueryKeys.detail(resolvedUserId) });
    },
  });

  return {
    ...query,
    updateUserDetails: updateMutation,
  };
}
