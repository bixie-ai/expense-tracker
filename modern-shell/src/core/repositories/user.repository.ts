import { ref, get, update } from 'firebase/database';
import { database } from '../../config/firebase';
import { UserDetailsSchema, UserDetailsDto } from '../api/schemas';

export class UserRepository {
  private basePath(userId: string) {
    return `users/${userId}`;
  }

  async get(userId: string): Promise<UserDetailsDto | null> {
    const snapshot = await get(ref(database, this.basePath(userId)));
    if (!snapshot.exists()) return null;

    const data = snapshot.val();
    return UserDetailsSchema.parse({
      firstName: data.firstName ?? '',
      lastName: data.lastName ?? '',
    });
  }

  async update(userId: string, userDetails: UserDetailsDto): Promise<UserDetailsDto> {
    const validated = UserDetailsSchema.parse(userDetails);
    await update(ref(database, this.basePath(userId)), validated);
    return validated;
  }
}

export const userRepository = new UserRepository();
