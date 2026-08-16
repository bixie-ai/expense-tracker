import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { renderHook } from '@testing-library/react';
import { FileUploadZone } from './FileUploadZone';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

function createFile(name: string, size: number, type: string): File {
  const content = new Array(size).fill('a').join('');
  return new File([content], name, { type });
}

function createMockDataTransfer(files: File[]) {
  return { files, items: files.map((f) => ({ kind: 'file', getAsFile: () => f })) };
}

describe('useDragAndDrop', () => {
  let onFilesSelected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFilesSelected = vi.fn();
  });

  it('should initialize with isDragOver as false', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFilesSelected }));
    expect(result.current.isDragOver).toBe(false);
  });

  it('should set isDragOver to true on dragOver', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFilesSelected }));

    const event = new Event('dragover', { bubbles: true }) as unknown as React.DragEvent<HTMLElement>;
    Object.assign(event, { preventDefault: vi.fn(), stopPropagation: vi.fn() });

    act(() => {
      result.current.handleDragOver(event as React.DragEvent<HTMLElement>);
    });

    expect(result.current.isDragOver).toBe(true);
  });

  it('should set isDragOver to false on dragLeave', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFilesSelected }));

    const dragOverEvent = new Event('dragover') as unknown as React.DragEvent<HTMLElement>;
    Object.assign(dragOverEvent, { preventDefault: vi.fn(), stopPropagation: vi.fn() });

    const dragLeaveEvent = new Event('dragleave') as unknown as React.DragEvent<HTMLElement>;
    Object.assign(dragLeaveEvent, { preventDefault: vi.fn(), stopPropagation: vi.fn() });

    act(() => {
      result.current.handleDragOver(dragOverEvent as React.DragEvent<HTMLElement>);
    });
    expect(result.current.isDragOver).toBe(true);

    act(() => {
      result.current.handleDragLeave(dragLeaveEvent as React.DragEvent<HTMLElement>);
    });
    expect(result.current.isDragOver).toBe(false);
  });

  it('should call onFilesSelected and reset isDragOver on drop with files', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFilesSelected }));

    const file = createFile('test.csv', 100, 'text/csv');
    const dt = createMockDataTransfer([file]);

    const dropEvent = new Event('drop') as unknown as React.DragEvent<HTMLElement>;
    Object.assign(dropEvent, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: dt,
    });

    act(() => {
      result.current.handleDragOver(dropEvent as React.DragEvent<HTMLElement>);
    });
    expect(result.current.isDragOver).toBe(true);

    act(() => {
      result.current.handleDrop(dropEvent as React.DragEvent<HTMLElement>);
    });

    expect(result.current.isDragOver).toBe(false);
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('should not call onFilesSelected on drop without files', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFilesSelected }));

    const dropEvent = new Event('drop') as unknown as React.DragEvent<HTMLElement>;
    Object.assign(dropEvent, {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn(),
      dataTransfer: { files: [] },
    });

    act(() => {
      result.current.handleDrop(dropEvent as React.DragEvent<HTMLElement>);
    });

    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  it('should prevent default browser behavior on all drag events', () => {
    const { result } = renderHook(() => useDragAndDrop({ onFilesSelected }));

    const preventDefault = vi.fn();
    const stopPropagation = vi.fn();

    const event = { preventDefault, stopPropagation } as unknown as React.DragEvent<HTMLElement>;

    act(() => {
      result.current.handleDragOver(event);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();

    preventDefault.mockClear();
    stopPropagation.mockClear();

    act(() => {
      result.current.handleDragLeave(event);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();

    preventDefault.mockClear();
    stopPropagation.mockClear();

    Object.assign(event, { dataTransfer: { files: [] } });
    act(() => {
      result.current.handleDrop(event);
    });
    expect(preventDefault).toHaveBeenCalled();
    expect(stopPropagation).toHaveBeenCalled();
  });
});

describe('FileUploadZone', () => {
  let onFilesSelected: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    onFilesSelected = vi.fn();
  });

  it('should render a dashed-border drop zone', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    expect(screen.getByRole('button', { name: /file upload drop zone/i })).toBeInTheDocument();
  });

  it('should display default instructional text', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    expect(screen.getByText('Drag & Drop files or Click to Browse')).toBeInTheDocument();
    expect(screen.getByText(/Accepted: .csv/)).toBeInTheDocument();
  });

  it('should highlight on drag-over', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const dropZone = screen.getByRole('button', { name: /file upload drop zone/i });

    fireEvent.dragOver(dropZone);
    expect(screen.getByText('Drop files here')).toBeInTheDocument();
  });

  it('should remove highlight on drag-leave', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const dropZone = screen.getByRole('button', { name: /file upload drop zone/i });

    fireEvent.dragOver(dropZone);
    expect(screen.getByText('Drop files here')).toBeInTheDocument();

    fireEvent.dragLeave(dropZone);
    expect(screen.getByText('Drag & Drop files or Click to Browse')).toBeInTheDocument();
  });

  it('should trigger file input on click', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const dropZone = screen.getByRole('button', { name: /file upload drop zone/i });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.click(dropZone);
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should trigger file input on Enter key', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const dropZone = screen.getByRole('button', { name: /file upload drop zone/i });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.keyDown(dropZone, { key: 'Enter' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should trigger file input on Space key', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const dropZone = screen.getByRole('button', { name: /file upload drop zone/i });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const clickSpy = vi.spyOn(fileInput, 'click');
    fireEvent.keyDown(dropZone, { key: ' ' });
    expect(clickSpy).toHaveBeenCalled();
  });

  it('should display selected file count and names after file selection via input', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = createFile('data.csv', 1024, 'text/csv');
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('1 file selected')).toBeInTheDocument();
    expect(screen.getByText('data.csv')).toBeInTheDocument();
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('should display plural file count for multiple files', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file1 = createFile('data1.csv', 1024, 'text/csv');
    const file2 = createFile('data2.csv', 2048, 'text/csv');
    fireEvent.change(fileInput, { target: { files: [file1, file2] } });

    expect(screen.getByText('2 files selected')).toBeInTheDocument();
  });

  it('should provide a clear button to reset state', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = createFile('data.csv', 1024, 'text/csv');
    fireEvent.change(fileInput, { target: { files: [file] } });

    expect(screen.getByText('1 file selected')).toBeInTheDocument();

    const clearButton = screen.getByRole('button', { name: /clear selected files/i });
    fireEvent.click(clearButton);

    expect(screen.queryByText('1 file selected')).not.toBeInTheDocument();
    expect(onFilesSelected).toHaveBeenLastCalledWith([]);
  });

  it('should show error for files exceeding 10MB', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const largeFile = createFile('big.csv', 11 * 1024 * 1024, 'text/csv');
    fireEvent.change(fileInput, { target: { files: [largeFile] } });

    expect(screen.getByText(/exceeds the 10MB size limit/)).toBeInTheDocument();
    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  it('should show error for invalid file types', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const pdfFile = createFile('report.pdf', 1024, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });

    expect(screen.getByText(/not an accepted type/)).toBeInTheDocument();
    expect(onFilesSelected).not.toHaveBeenCalled();
  });

  it('should accept files dropped via drag and drop', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const dropZone = screen.getByRole('button', { name: /file upload drop zone/i });

    const file = createFile('data.csv', 512, 'text/csv');
    const dt = createMockDataTransfer([file]);

    fireEvent.drop(dropZone, { dataTransfer: dt });

    expect(screen.getByText('1 file selected')).toBeInTheDocument();
    expect(screen.getByText('data.csv')).toBeInTheDocument();
    expect(onFilesSelected).toHaveBeenCalledWith([file]);
  });

  it('should clear error on valid file selection after error', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    const pdfFile = createFile('report.pdf', 1024, 'application/pdf');
    fireEvent.change(fileInput, { target: { files: [pdfFile] } });
    expect(screen.getByText(/not an accepted type/)).toBeInTheDocument();

    const csvFile = createFile('data.csv', 1024, 'text/csv');
    fireEvent.change(fileInput, { target: { files: [csvFile] } });
    expect(screen.queryByText(/not an accepted type/)).not.toBeInTheDocument();
    expect(screen.getByText('data.csv')).toBeInTheDocument();
  });

  it('should have accessible file input hidden from tab order', () => {
    render(<FileUploadZone onFilesSelected={onFilesSelected} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toHaveAttribute('aria-hidden', 'true');
    expect(fileInput).toHaveAttribute('tabindex', '-1');
  });
});
