import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, File, AlertCircle, CheckCircle } from 'lucide-react';

import { BugReporterConfig, UploadingFile } from '../types';
import { validationManager, generateId, formatFileSize, getFileTypeIcon } from '../utils';

interface FileUploadProps {
  config: BugReporterConfig;
  onFilesUploaded: (files: UploadingFile[]) => void;
  uploadingFiles: UploadingFile[];
  onRemoveFile: (fileId: string) => void;
}

export function FileUpload({ config, onFilesUploaded, uploadingFiles, onRemoveFile }: FileUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return;

    // Validate files
    const validation = validationManager.validateMultipleFiles(files, config);
    if (!validation.isValid) {
      // Show validation errors
      console.error('File validation failed:', validation.errors);
      return;
    }

    // Create uploading file objects
    const newUploadingFiles: UploadingFile[] = files.map(file => ({
      id: generateId('file_'),
      name: file.name,
      placeholder: `Uploading ${file.name}...`,
      status: 'uploading' as const
    }));

    // Notify parent component
    onFilesUploaded(newUploadingFiles);

    // Simulate file upload (in a real implementation, this would call an upload API)
    for (const uploadingFile of newUploadingFiles) {
      try {
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
        
        // Simulate success (in real implementation, you'd get the URL from your upload service)
        const successFile: UploadingFile = {
          ...uploadingFile,
          status: 'success',
          url: `https://example.com/uploads/${uploadingFile.id}`
        };

        // Update the file status
        onFilesUploaded([successFile]);
        
      } catch (error) {
        // Handle upload error
        const errorFile: UploadingFile = {
          ...uploadingFile,
          status: 'error',
          errorMessage: error instanceof Error ? error.message : 'Upload failed'
        };

        onFilesUploaded([errorFile]);
      }
    }
  }, [config, onFilesUploaded]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(event.dataTransfer.files);
    handleFiles(files);
  }, [handleFiles]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.stopPropagation();
    
    // Only set drag over to false if we're leaving the drop zone entirely
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX;
    const y = event.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    handleFiles(files);
    
    // Clear the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  const handleUploadAreaClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Don't render if file uploads are disabled
  if (config.validation?.maxFiles === 0) {
    return null;
  }

  const maxFiles = config.validation?.maxFiles;
  const canUploadMore = !maxFiles || uploadingFiles.length < maxFiles;

  return (
    <div>
      <label className="br-label">Attachments</label>
      
      {/* Upload area */}
      {canUploadMore && (
        <div
          className={`br-file-upload-area ${isDragOver ? 'br-drag-over' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onClick={handleUploadAreaClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileInputChange}
            multiple={!maxFiles || maxFiles > 1}
            accept={config.validation?.allowedFileTypes?.join(',')}
            style={{ display: 'none' }}
          />
          
          <Upload size={24} style={{ marginBottom: '8px', opacity: 0.6 }} />
          
          <div className="br-file-upload-text">
            {isDragOver ? 'Drop files here' : 'Click to upload or drag and drop'}
          </div>
          
          <div className="br-file-upload-hint">
            {config.validation?.allowedFileTypes ? (
              `Accepted: ${config.validation.allowedFileTypes.join(', ')}`
            ) : (
              'Images, videos, documents'
            )}
            {config.validation?.maxFileSize && (
              ` · Max size: ${formatFileSize(config.validation.maxFileSize)}`
            )}
          </div>
        </div>
      )}

      {/* File list */}
      {uploadingFiles.length > 0 && (
        <ul className="br-file-list">
          {uploadingFiles.map((file) => (
            <FileItem
              key={file.id}
              file={file}
              onRemove={() => onRemoveFile(file.id)}
            />
          ))}
        </ul>
      )}

      {/* Upload limit info */}
      {maxFiles && (
        <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '8px' }}>
          {uploadingFiles.length} of {maxFiles} files
        </div>
      )}
    </div>
  );
}

interface FileItemProps {
  file: UploadingFile;
  onRemove: () => void;
}

function FileItem({ file, onRemove }: FileItemProps) {
  const getStatusIcon = () => {
    switch (file.status) {
      case 'uploading':
        return <Upload size={16} className="br-spinner" />;
      case 'success':
        return <CheckCircle size={16} style={{ color: 'var(--br-color-success)' }} />;
      case 'error':
        return <AlertCircle size={16} style={{ color: 'var(--br-color-error)' }} />;
      default:
        return <File size={16} />;
    }
  };

  const getStatusColor = () => {
    switch (file.status) {
      case 'uploading':
        return { backgroundColor: 'rgb(59 130 246 / 0.1)', color: '#2563eb' };
      case 'success':
        return { backgroundColor: 'rgb(34 197 94 / 0.1)', color: 'var(--br-color-success)' };
      case 'error':
        return { backgroundColor: 'rgb(239 68 68 / 0.1)', color: 'var(--br-color-error)' };
      default:
        return {};
    }
  };

  return (
    <li className="br-file-item" style={getStatusColor()}>
      <div className="br-file-info">
        {getStatusIcon()}
        <div style={{ minWidth: 0 }}>
          <div className="br-file-name">{file.name}</div>
          {file.status === 'error' && file.errorMessage && (
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              {file.errorMessage}
            </div>
          )}
          {file.status === 'uploading' && (
            <div style={{ fontSize: '12px', opacity: 0.8 }}>
              Uploading...
            </div>
          )}
        </div>
      </div>
      
      <button
        onClick={onRemove}
        className="br-file-remove"
        aria-label={`Remove ${file.name}`}
        disabled={file.status === 'uploading'}
      >
        <X size={14} />
      </button>
    </li>
  );
}