import { useState, useCallback, DragEvent } from 'react';

export interface UseDragAndDropOptions {
  onFilesSelected: (files: File[]) => void;
}

export interface UseDragAndDropReturn {
  isDragOver: boolean;
  handleDragOver: (e: DragEvent<HTMLElement>) => void;
  handleDragLeave: (e: DragEvent<HTMLElement>) => void;
  handleDrop: (e: DragEvent<HTMLElement>) => void;
}

export function useDragAndDrop({ onFilesSelected }: UseDragAndDropOptions): UseDragAndDropReturn {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        onFilesSelected(Array.from(files));
      }
    },
    [onFilesSelected]
  );

  return { isDragOver, handleDragOver, handleDragLeave, handleDrop };
}
