import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ExportButton } from '../ExportButton';
import type { Expense } from '@/types/expense';

vi.mock('@/hooks/use-csv-export', () => ({
  useCsvExport: vi.fn(),
}));

import { useCsvExport } from '@/hooks/use-csv-export';

const mockUseCsvExport = vi.mocked(useCsvExport);

describe('ExportButton', () => {
  const sampleData: Expense[] = [
    { name: 'Test', amount: 10, date: '2024-01-01', category: 'Food', type: 'expense' },
  ];

  beforeEach(() => {
    mockUseCsvExport.mockReturnValue({
      exportCsv: vi.fn(),
      isExporting: false,
      error: null,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should render Export CSV button', () => {
    render(<ExportButton data={sampleData} />);
    expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument();
  });

  it('should call exportCsv when clicked', async () => {
    const exportCsvMock = vi.fn();
    mockUseCsvExport.mockReturnValue({ exportCsv: exportCsvMock, isExporting: false, error: null });

    render(<ExportButton data={sampleData} />);
    await userEvent.click(screen.getByRole('button', { name: /export csv/i }));

    expect(exportCsvMock).toHaveBeenCalledWith(sampleData);
  });

  it('should be disabled when data is empty', () => {
    render(<ExportButton data={[]} />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should be disabled when explicitly disabled', () => {
    render(<ExportButton data={sampleData} disabled />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should show Exporting text when isExporting is true', () => {
    mockUseCsvExport.mockReturnValue({ exportCsv: vi.fn(), isExporting: true, error: null });

    render(<ExportButton data={sampleData} />);
    expect(screen.getByRole('button', { name: /exporting/i })).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('should display error message when error exists', () => {
    mockUseCsvExport.mockReturnValue({ exportCsv: vi.fn(), isExporting: false, error: 'Something failed' });

    render(<ExportButton data={sampleData} />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
  });

  it('should pass fileName to useCsvExport', () => {
    render(<ExportButton data={sampleData} fileName="custom-name" />);
    expect(mockUseCsvExport).toHaveBeenCalledWith({ fileName: 'custom-name' });
  });
});
