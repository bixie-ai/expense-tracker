import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FileImportMapper } from '../components/file-import-mapper/FileImportMapper';

const csvHeaders = ['Description', 'Total', 'TransDate', 'Category', 'Type'];
const csvData = [
  { Description: 'Coffee', Total: '5.00', TransDate: '2024-01-01', Category: 'Food', Type: 'Debit' },
  { Description: 'Lunch', Total: '12.50', TransDate: '2024-01-02', Category: 'Food', Type: 'Debit' },
];

function createMockFile(name = 'test.csv'): File {
  return new File(['content'], name, { type: 'text/csv' });
}

describe('FileImportMapper', () => {
  let onPreviewData: ReturnType<typeof vi.fn>;
  let onValidityChange: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onPreviewData = vi.fn();
    onValidityChange = vi.fn();
  });

  function renderComponent(props = {}) {
    return render(
      <FileImportMapper
        file={createMockFile()}
        csvData={csvData}
        csvHeaders={csvHeaders}
        onPreviewData={onPreviewData}
        onValidityChange={onValidityChange}
        {...props}
      />
    );
  }

  it('should render select inputs for each expense property', () => {
    renderComponent();

    expect(screen.getByLabelText(/Map Expense Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Map Amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Map Date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Map Category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Map Payment Type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Map Comments/i)).toBeInTheDocument();
  });

  it('should render negative amount radio options', () => {
    renderComponent();

    expect(screen.getByLabelText('Omit Negative Amounts')).toBeInTheDocument();
    expect(screen.getByLabelText('Treat Negative Amounts as Credits')).toBeInTheDocument();
    expect(screen.getByLabelText('Treat Negative Amounts as Debits')).toBeInTheDocument();
  });

  it('should have an accessible form label', () => {
    renderComponent();
    expect(screen.getByLabelText('CSV column mapping form')).toBeInTheDocument();
  });

  it('should report invalid when form is empty', async () => {
    renderComponent();

    await waitFor(() => {
      expect(onValidityChange).toHaveBeenCalledWith(false);
    });
  });

  it('should report valid and generate preview when all required fields are mapped', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText(/Map Expense Name/i));
    await user.click(await screen.findByRole('option', { name: 'Description' }));

    await user.click(screen.getByLabelText(/Map Amount/i));
    await user.click(await screen.findByRole('option', { name: 'Total' }));

    await user.click(screen.getByLabelText(/Map Date/i));
    await user.click(await screen.findByRole('option', { name: 'TransDate' }));

    await user.click(screen.getByLabelText('Treat Negative Amounts as Credits'));

    await waitFor(() => {
      expect(onValidityChange).toHaveBeenLastCalledWith(true);
    });

    await waitFor(() => {
      expect(onPreviewData).toHaveBeenCalled();
      const lastCall = onPreviewData.mock.calls[onPreviewData.mock.calls.length - 1][0];
      expect(lastCall).toHaveLength(2);
      expect(lastCall[0].name).toBe('Coffee');
    });
  });

  it('should show error for duplicate column mappings', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText(/Map Expense Name/i));
    await user.click(await screen.findByRole('option', { name: 'Description' }));

    await user.click(screen.getByLabelText(/Map Amount/i));
    await user.click(await screen.findByRole('option', { name: 'Description' }));

    await waitFor(() => {
      const errors = screen.getAllByText(/Column "Description" is already mapped/i);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  it('should allow optional fields to remain unmapped', async () => {
    const user = userEvent.setup();
    renderComponent();

    await user.click(screen.getByLabelText(/Map Expense Name/i));
    await user.click(await screen.findByRole('option', { name: 'Description' }));

    await user.click(screen.getByLabelText(/Map Amount/i));
    await user.click(await screen.findByRole('option', { name: 'Total' }));

    await user.click(screen.getByLabelText(/Map Date/i));
    await user.click(await screen.findByRole('option', { name: 'TransDate' }));

    await user.click(screen.getByLabelText('Omit Negative Amounts'));

    await waitFor(() => {
      expect(onValidityChange).toHaveBeenLastCalledWith(true);
    });
  });

  it('should show required field legend for negative amounts', () => {
    renderComponent();
    expect(screen.getByText(/How to handle negative amounts\?/i)).toBeInTheDocument();
  });
});
