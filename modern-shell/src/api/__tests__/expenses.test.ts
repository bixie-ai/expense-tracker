import { fetchExpenses } from '../expenses';
import { get, ref, getDatabase } from 'firebase/database';

vi.mock('@/config/firebase', () => ({
  app: {},
}));

vi.mock('firebase/database', () => ({
  getDatabase: vi.fn(() => ({})),
  ref: vi.fn(() => ({})),
  get: vi.fn(),
}));

describe('fetchExpenses', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return empty array when snapshot does not exist', async () => {
    vi.mocked(get).mockResolvedValue({ exists: () => false, val: () => null } as never);

    const result = await fetchExpenses('user-1');

    expect(result).toEqual([]);
    expect(getDatabase).toHaveBeenCalled();
    expect(ref).toHaveBeenCalledWith({}, 'users/user-1/expenses');
  });

  it('should parse and return expenses with id keys', async () => {
    const rawData = {
      '-abc123': { name: 'Groceries', date: '2024-03-15', category: 'Food', type: 'Debit', amount: 50 },
      '-def456': { name: 'Gas', date: '2024-03-20', category: 'Transport', type: 'Credit', amount: 40 },
    };
    vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => rawData } as never);

    const result = await fetchExpenses('user-1');

    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ id: '-abc123', name: 'Groceries', date: '2024-03-15', category: 'Food', type: 'Debit', amount: 50 });
    expect(result[1]).toEqual({ id: '-def456', name: 'Gas', date: '2024-03-20', category: 'Transport', type: 'Credit', amount: 40 });
  });

  it('should throw ZodError when data does not match schema', async () => {
    const invalidData = {
      '-abc123': { name: 123, date: '2024-03-15' },
    };
    vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => invalidData } as never);

    await expect(fetchExpenses('user-1')).rejects.toThrow();
  });

  it('should handle expenses with optional fields', async () => {
    const rawData = {
      '-abc123': {
        name: 'Import',
        date: '2024-03-15',
        category: 'Food',
        type: 'Debit',
        amount: 50,
        comments: 'weekly shop',
        importedOn: '2024-03-16T00:00:00.000Z',
        importedFrom: 'bank-csv',
      },
    };
    vi.mocked(get).mockResolvedValue({ exists: () => true, val: () => rawData } as never);

    const result = await fetchExpenses('user-1');

    expect(result).toHaveLength(1);
    expect(result[0].comments).toBe('weekly shop');
    expect(result[0].importedFrom).toBe('bank-csv');
    expect(result[0].importedOn).toBeInstanceOf(Date);
  });
});
