import React from 'react';
import { X, Download, Copy } from 'lucide-react';
import { copyToClipboard } from '../utils';

interface ScreenshotPreviewProps {
  screenshot: string;
  onRemove: () => void;
}

export function ScreenshotPreview({ screenshot, onRemove }: ScreenshotPreviewProps) {
  const handleDownload = () => {
    try {
      const link = document.createElement('a');
      link.href = screenshot;
      link.download = `bug-report-screenshot-${Date.now()}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Failed to download screenshot:', error);
    }
  };

  const handleCopy = async () => {
    try {
      // Convert data URL to blob
      const response = await fetch(screenshot);
      const blob = await response.blob();
      
      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({
            'image/png': blob
          })
        ]);
      } else {
        // Fallback: copy the data URL as text
        const success = await copyToClipboard(screenshot);
        if (!success) {
          throw new Error('Failed to copy to clipboard');
        }
      }
    } catch (error) {
      console.error('Failed to copy screenshot:', error);
    }
  };

  return (
    <div className="br-screenshot-preview">
      <div style={{ position: 'relative' }}>
        <img
          src={screenshot}
          alt="Screenshot preview"
          className="br-screenshot-image"
        />
        <div className="br-screenshot-overlay" />
        
        {/* Action buttons */}
        <div style={{
          position: 'absolute',
          top: '8px',
          right: '8px',
          display: 'flex',
          gap: '4px'
        }}>
          <button
            type="button"
            onClick={handleCopy}
            className="br-button br-button-secondary"
            style={{
              padding: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--br-color-foreground)',
              border: '1px solid var(--br-color-border)'
            }}
            aria-label="Copy screenshot"
            title="Copy screenshot"
          >
            <Copy size={14} />
          </button>
          
          <button
            type="button"
            onClick={handleDownload}
            className="br-button br-button-secondary"
            style={{
              padding: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              color: 'var(--br-color-foreground)',
              border: '1px solid var(--br-color-border)'
            }}
            aria-label="Download screenshot"
            title="Download screenshot"
          >
            <Download size={14} />
          </button>
          
          <button
            type="button"
            onClick={onRemove}
            className="br-button"
            style={{
              padding: '4px',
              backgroundColor: 'rgba(220, 38, 38, 0.9)',
              color: 'white',
              border: 'none'
            }}
            aria-label="Remove screenshot"
            title="Remove screenshot"
          >
            <X size={14} />
          </button>
        </div>
      </div>
      
      <p className="br-screenshot-hint">
        Screenshot will be included with your report
      </p>
    </div>
  );
}