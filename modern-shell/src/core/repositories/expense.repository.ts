import { ref, get, push, update, remove } from 'firebase/database';
import { database } from '../../config/firebase';
import { ExpenseSchema, ExpenseInputSchema, ExpenseDto, ExpenseInputDto } from '../api/schemas';

export class ExpenseRepository {
  private basePath(userId: string) {
    return `users/${userId}/expenses`;
  }

  async getByUser(userId: string): Promise<ExpenseDto[]> {
    const snapshot = await get(ref(database, this.basePath(userId)));
    if (!snapshot.exists()) return [];

    const data = snapshot.val() as Record<string, unknown>;
    return Object.entries(data).map(([id, expense]) =>
      ExpenseSchema.parse({ ...(expense as object), id }),
    );
  }

  async create(userId: string, expense: ExpenseInputDto): Promise<ExpenseDto> {
    const validated = ExpenseInputSchema.parse(expense);
    const result = await push(ref(database, this.basePath(userId)), validated);
    return ExpenseSchema.parse({ ...validated, id: result.key });
  }

  async update(userId: string, expenseId: string, expense: ExpenseInputDto): Promise<ExpenseDto> {
    const validated = ExpenseInputSchema.parse(expense);
    await update(ref(database, `${this.basePath(userId)}/${expenseId}`), validated);
    return ExpenseSchema.parse({ ...validated, id: expenseId });
  }

  async delete(userId: string, expenseId: string): Promise<void> {
    await remove(ref(database, `${this.basePath(userId)}/${expenseId}`));
  }
}

export const expenseRepository = new ExpenseRepository();
