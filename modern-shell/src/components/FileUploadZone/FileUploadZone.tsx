import { useRef, useState, useCallback, ChangeEvent } from 'react';
import { Box, Typography, IconButton, List, ListItem, ListItemText } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import ClearIcon from '@mui/icons-material/Clear';
import { useDragAndDrop } from '@/hooks/useDragAndDrop';

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export interface FileUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  acceptedTypes?: string[];
  multiple?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileUploadZone({
  onFilesSelected,
  acceptedTypes = ['.csv'],
  multiple = true,
}: FileUploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const validateFiles = useCallback(
    (files: File[]): string | null => {
      for (const file of files) {
        if (file.size > MAX_FILE_SIZE_BYTES) {
          return `File "${file.name}" exceeds the 10MB size limit.`;
        }
        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (acceptedTypes.length > 0 && !acceptedTypes.includes(extension)) {
          return `File "${file.name}" is not an accepted type. Accepted: ${acceptedTypes.join(', ')}`;
        }
      }
      return null;
    },
    [acceptedTypes]
  );

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      const validationError = validateFiles(files);
      if (validationError) {
        setError(validationError);
        return;
      }
      setError(null);
      setSelectedFiles(files);
      onFilesSelected(files);
    },
    [validateFiles, onFilesSelected]
  );

  const { isDragOver, handleDragOver, handleDragLeave, handleDrop } = useDragAndDrop({
    onFilesSelected: handleFilesSelected,
  });

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFilesSelected(Array.from(files));
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setError(null);
    onFilesSelected([]);
  };

  return (
    <Box>
      <Box
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleBrowseClick}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleBrowseClick();
          }
        }}
        aria-label="File upload drop zone"
        sx={{
          border: '2px dashed',
          borderColor: isDragOver ? 'primary.main' : 'divider',
          borderRadius: 2,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          cursor: 'pointer',
          transition: 'border-color 0.2s, background-color 0.2s',
          backgroundColor: isDragOver ? 'primary.light' : 'transparent',
          '&:hover': {
            borderColor: 'primary.main',
          },
          '&:focus-visible': {
            outline: '2px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
          },
        }}
      >
        <UploadFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragOver ? 'Drop files here' : 'Drag & Drop files or Click to Browse'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Accepted: {acceptedTypes.join(', ')} (max 10MB per file)
        </Typography>
      </Box>

      <input
        ref={fileInputRef}
        type="file"
        hidden
        multiple={multiple}
        accept={acceptedTypes.join(',')}
        onChange={handleFileInputChange}
        aria-hidden="true"
        tabIndex={-1}
      />

      {error && (
        <Typography variant="body2" color="error" sx={{ mt: 1 }}>
          {error}
        </Typography>
      )}

      {selectedFiles.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="body2" color="text.secondary">
              {selectedFiles.length} file{selectedFiles.length !== 1 ? 's' : ''} selected
            </Typography>
            <IconButton onClick={handleClear} size="small" aria-label="Clear selected files">
              <ClearIcon fontSize="small" />
            </IconButton>
          </Box>
          <List dense>
            {selectedFiles.map((file, index) => (
              <ListItem key={index} disablePadding>
                <ListItemText
                  primary={file.name}
                  secondary={formatFileSize(file.size)}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      )}
    </Box>
  );
}
