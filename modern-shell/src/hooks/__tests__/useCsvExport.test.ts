import { renderHook, act } from '@testing-library/react';
import { useCsvExport } from '../use-csv-export';
import type { Expense } from '@/types/expense';

describe('useCsvExport', () => {
  let createObjectURLMock: ReturnType<typeof vi.fn>;
  let revokeObjectURLMock: ReturnType<typeof vi.fn>;
  let appendChildSpy: ReturnType<typeof vi.fn>;
  let removeChildSpy: ReturnType<typeof vi.fn>;
  let clickSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    createObjectURLMock = vi.fn(() => 'blob:http://localhost/fake-url');
    revokeObjectURLMock = vi.fn();
    clickSpy = vi.fn();

    Object.defineProperty(global, 'URL', {
      value: { createObjectURL: createObjectURLMock, revokeObjectURL: revokeObjectURLMock },
      writable: true,
    });

    appendChildSpy = vi.fn((node: Node) => {
      if (node instanceof HTMLAnchorElement) {
        node.click = clickSpy;
      }
      return node;
    });
    removeChildSpy = vi.fn((node: Node) => node);
    vi.spyOn(document.body, 'appendChild').mockImplementation(appendChildSpy);
    vi.spyOn(document.body, 'removeChild').mockImplementation(removeChildSpy);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  const sampleData: Expense[] = [
    { name: 'Lunch', amount: 12.50, date: '2024-03-15', category: 'Food', type: 'expense', comments: 'With team' },
  ];

  it('should return initial state', () => {
    const { result } = renderHook(() => useCsvExport());

    expect(result.current.isExporting).toBe(false);
    expect(result.current.error).toBeNull();
    expect(typeof result.current.exportCsv).toBe('function');
  });

  it('should trigger file download on exportCsv', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useCsvExport({ fileName: 'test-export' }));

    act(() => {
      result.current.exportCsv(sampleData);
    });

    expect(createObjectURLMock).toHaveBeenCalledWith(expect.any(Blob));
    expect(appendChildSpy).toHaveBeenCalled();
    expect(clickSpy).toHaveBeenCalled();

    act(() => {
      vi.advanceTimersByTime(100);
    });

    expect(removeChildSpy).toHaveBeenCalled();
    expect(revokeObjectURLMock).toHaveBeenCalledWith('blob:http://localhost/fake-url');
  });

  it('should create a Blob with correct MIME type', () => {
    const { result } = renderHook(() => useCsvExport());

    act(() => {
      result.current.exportCsv(sampleData);
    });

    const blobArg = createObjectURLMock.mock.calls[0][0] as Blob;
    expect(blobArg.type).toBe('text/csv;charset=utf-8;');
  });

  it('should set error when data is empty', () => {
    const { result } = renderHook(() => useCsvExport());

    act(() => {
      result.current.exportCsv([]);
    });

    expect(result.current.error).toBe('No data to export');
    expect(result.current.isExporting).toBe(false);
    expect(createObjectURLMock).not.toHaveBeenCalled();
  });

  it('should include fileName in download attribute', () => {
    let capturedLink: HTMLAnchorElement | null = null;
    appendChildSpy.mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        capturedLink = node;
        node.click = clickSpy;
      }
      return node;
    });

    const { result } = renderHook(() => useCsvExport({ fileName: 'my-expenses' }));

    act(() => {
      result.current.exportCsv(sampleData);
    });

    expect(capturedLink).not.toBeNull();
    expect(capturedLink!.download).toMatch(/^my-expenses-\d{2}-\d{2}-\d{4} \d{2}-\d{2}-\d{2}\.csv$/);
  });

  it('should use default fileName when not provided', () => {
    let capturedLink: HTMLAnchorElement | null = null;
    appendChildSpy.mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        capturedLink = node;
        node.click = clickSpy;
      }
      return node;
    });

    const { result } = renderHook(() => useCsvExport());

    act(() => {
      result.current.exportCsv(sampleData);
    });

    expect(capturedLink!.download).toMatch(/^expenses-export-/);
  });

  it('should reset error on next export call', () => {
    const { result } = renderHook(() => useCsvExport());

    act(() => {
      result.current.exportCsv([]);
    });
    expect(result.current.error).toBe('No data to export');

    act(() => {
      result.current.exportCsv(sampleData);
    });
    expect(result.current.error).toBeNull();
  });
});
