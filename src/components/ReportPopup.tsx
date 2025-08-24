import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Bug, Send, Loader2, Upload, Camera } from 'lucide-react';

import { BugReportData, BugReporterConfig, UploadingFile } from '../types';
import { bugReportCapture } from '../core/capture';
import { validationManager, generateId, formatFileSize, getFileTypeIcon, debounce } from '../utils';
import { FileUpload } from './FileUpload';
import { ScreenshotPreview } from './ScreenshotPreview';
import { FormField } from './FormField';

interface ReportPopupProps {
  config: BugReporterConfig;
  position: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  isSubmitting: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (data: Partial<BugReportData>) => Promise<void>;
}

export function ReportPopup({
  config,
  position,
  isSubmitting,
  error,
  onClose,
  onSubmit
}: ReportPopupProps) {
  // Form state
  const [formData, setFormData] = useState<Partial<BugReportData>>({});
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  
  // UI state
  const [isCapturingScreenshot, setIsCapturingScreenshot] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  
  const formRef = useRef<HTMLFormElement>(null);

  // Position classes
  const positionClasses = {
    'bottom-right': 'br-position-bottom-right',
    'bottom-left': 'br-position-bottom-left',
    'top-right': 'br-position-top-right',
    'top-left': 'br-position-top-left'
  };

  // Capture screenshot on mount if enabled
  useEffect(() => {
    if (config.ui?.showScreenshot !== false && config.capture?.captureScreenshot !== false) {
      captureScreenshot();
    }
  }, []);

  // Debounced validation
  const debouncedValidate = debounce(() => {
    const validation = validationManager.validateBugReport(formData, config);
    setValidationErrors(validation.errors);
  }, 300);

  // Validate on form data change
  useEffect(() => {
    debouncedValidate();
  }, [formData]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
        event.preventDefault();
        handleSubmit(event as any);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const updateFormData = (updates: Partial<BugReportData>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  };

  const captureScreenshot = async () => {
    setIsCapturingScreenshot(true);
    try {
      const screenshot = await bugReportCapture.captureScreenshot({
        excludeSelectors: config.privacy?.excludeSelectors,
        scale: config.capture?.screenshotScale,
        format: config.capture?.screenshotFormat,
        quality: config.capture?.screenshotQuality,
        captureViewport: config.capture?.captureViewport
      });
      
      if (screenshot) {
        setScreenshotPreview(screenshot);
        updateFormData({ screenshot });
      }
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    } finally {
      setIsCapturingScreenshot(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Final validation
    const validation = validationManager.validateBugReport(formData, config);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      await onSubmit({
        ...formData,
        additionalFiles: uploadingFiles
          .filter(file => file.status === 'success')
          .map(file => ({
            id: file.id,
            name: file.name,
            url: file.url!,
            type: '', // Would be set during upload
            size: 0 // Would be set during upload
          }))
      });
    } catch (error) {
      // Error is handled by parent component
      console.error('Submission error:', error);
    }
  };

  const handleFileUpload = (files: UploadingFile[]) => {
    setUploadingFiles(prev => [...prev, ...files]);
  };

  const removeFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(file => file.id !== fileId));
  };

  // Get default field configuration
  const getDefaultFields = () => [
    {
      type: 'text' as const,
      key: 'title',
      label: 'Title',
      placeholder: 'Brief summary of the issue',
      required: config.validation?.requireTitle ?? true
    },
    {
      type: 'textarea' as const,
      key: 'description',
      label: 'Description',
      placeholder: 'Please describe the issue you\'re experiencing...',
      required: config.validation?.requireDescription ?? true
    },
    ...(config.ui?.showUserInfo !== false ? [{
      type: 'email' as const,
      key: 'userEmail',
      label: 'Email (optional)',
      placeholder: 'your@email.com',
      required: config.validation?.requireEmail ?? false
    }] : [])
  ];

  const fields = config.ui?.fields || getDefaultFields();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`br-popup-container ${positionClasses[position]}`}
      data-bug-reporter-popup
    >
      {/* Header */}
      <div className="br-popup-header">
        <h3 className="br-popup-title">
          <Bug size={18} />
          {config.ui?.title || 'Report an Issue'}
        </h3>
        <button
          onClick={onClose}
          className="br-close-button"
          aria-label="Close"
          disabled={isSubmitting}
        >
          <X size={16} />
        </button>
      </div>

      {/* Form */}
      <form ref={formRef} onSubmit={handleSubmit} className="br-form">
        {/* Subtitle */}
        {config.ui?.subtitle && (
          <p className="br-subtitle" style={{ fontSize: '14px', marginBottom: '16px', opacity: 0.8 }}>
            {config.ui.subtitle}
          </p>
        )}

        {/* Dynamic form fields */}
        {fields.map((field, index) => (
          <FormField
            key={`${field.key}-${index}`}
            field={field}
            value={formData[field.key as keyof BugReportData] as string}
            onChange={(value) => updateFormData({ [field.key]: value })}
            error={validationErrors.find(error => error.toLowerCase().includes(field.label.toLowerCase()))}
          />
        ))}

        {/* File upload */}
        <div className="br-form-group">
          <FileUpload
            config={config}
            onFilesUploaded={handleFileUpload}
            uploadingFiles={uploadingFiles}
            onRemoveFile={removeFile}
          />
        </div>

        {/* Screenshot section */}
        {config.ui?.showScreenshot !== false && (
          <div className="br-form-group">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <label className="br-label">Screenshot</label>
              <button
                type="button"
                onClick={captureScreenshot}
                disabled={isCapturingScreenshot}
                className="br-button br-button-secondary"
                style={{ padding: '4px 8px', fontSize: '12px' }}
              >
                {isCapturingScreenshot ? (
                  <>
                    <Loader2 size={14} className="br-spinner" />
                    Capturing...
                  </>
                ) : (
                  <>
                    <Camera size={14} />
                    Retake
                  </>
                )}
              </button>
            </div>
            
            {screenshotPreview ? (
              <ScreenshotPreview
                screenshot={screenshotPreview}
                onRemove={() => {
                  setScreenshotPreview(null);
                  updateFormData({ screenshot: undefined });
                }}
              />
            ) : (
              <div style={{ 
                padding: '24px', 
                border: '1px dashed var(--br-color-border)', 
                borderRadius: 'var(--br-border-radius)',
                textAlign: 'center' as const,
                fontSize: '14px',
                opacity: 0.7
              }}>
                No screenshot captured
              </div>
            )}
          </div>
        )}

        {/* Console logs preview (if enabled) */}
        {config.ui?.showConsole && (
          <div className="br-form-group">
            <label className="br-label">Recent Console Activity</label>
            <ConsolePreview />
          </div>
        )}

        {/* Network requests preview (if enabled) */}
        {config.ui?.showNetwork && (
          <div className="br-form-group">
            <label className="br-label">Recent Network Activity</label>
            <NetworkPreview />
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="br-error" style={{ marginBottom: '16px', padding: '8px', backgroundColor: 'rgb(220 38 38 / 0.1)', borderRadius: '4px' }}>
            {config.ui?.errorMessage || error}
          </div>
        )}

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="br-error" style={{ marginBottom: '16px' }}>
            <ul style={{ margin: 0, paddingLeft: '16px' }}>
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting || validationErrors.length > 0}
          className="br-button br-button-primary br-button-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={16} className="br-spinner" />
              {config.ui?.loadingMessage || 'Submitting...'}
            </>
          ) : (
            <>
              <Send size={16} />
              {config.ui?.submitButtonText || 'Submit Report'}
            </>
          )}
        </button>

        {/* Footer text */}
        <p style={{ fontSize: '12px', textAlign: 'center' as const, marginTop: '12px', opacity: 0.7 }}>
          Technical details will be automatically included
        </p>
      </form>
    </motion.div>
  );
}

// Console preview component
function ConsolePreview() {
  const [logs, setLogs] = useState(bugReportCapture.getConsoleLogs().slice(-5));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLogs(bugReportCapture.getConsoleLogs().slice(-5));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (logs.length === 0) {
    return (
      <div style={{ fontSize: '12px', opacity: 0.7, fontStyle: 'italic' }}>
        No recent console activity
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--br-color-muted)',
      borderRadius: '4px',
      padding: '8px',
      fontSize: '11px',
      fontFamily: 'monospace',
      maxHeight: '120px',
      overflowY: 'auto' as const
    }}>
      {logs.map((log, index) => (
        <div
          key={index}
          style={{
            marginBottom: '2px',
            color: log.level === 'error' ? 'var(--br-color-error)' : 
                   log.level === 'warn' ? 'var(--br-color-warning)' : 
                   'var(--br-color-foreground)'
          }}
        >
          <span style={{ opacity: 0.6 }}>
            [{new Date(log.timestamp).toLocaleTimeString()}]
          </span>{' '}
          <span style={{ fontWeight: 'bold' }}>{log.level.toUpperCase()}:</span>{' '}
          {log.message.substring(0, 100)}
        </div>
      ))}
    </div>
  );
}

// Network preview component
function NetworkPreview() {
  const [requests, setRequests] = useState(bugReportCapture.getNetworkRequests().slice(-5));
  
  useEffect(() => {
    const interval = setInterval(() => {
      setRequests(bugReportCapture.getNetworkRequests().slice(-5));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (requests.length === 0) {
    return (
      <div style={{ fontSize: '12px', opacity: 0.7, fontStyle: 'italic' }}>
        No recent network activity
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: 'var(--br-color-muted)',
      borderRadius: '4px',
      padding: '8px',
      fontSize: '11px',
      maxHeight: '120px',
      overflowY: 'auto' as const
    }}>
      {requests.map((request, index) => (
        <div
          key={index}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2px',
            padding: '2px 0'
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <span style={{ 
              fontWeight: 'bold',
              color: request.status && request.status >= 400 ? 'var(--br-color-error)' : 'var(--br-color-foreground)'
            }}>
              {request.method}
            </span>{' '}
            <span style={{ opacity: 0.8 }}>
              {request.url.length > 40 ? `${request.url.substring(0, 40)}...` : request.url}
            </span>
          </div>
          <div style={{ fontSize: '10px', opacity: 0.6 }}>
            {request.status || 'pending'} · {request.duration || 0}ms
          </div>
        </div>
      ))}
    </div>
  );
}