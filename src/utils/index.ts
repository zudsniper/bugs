export { KeyboardManager, keyboardManager } from './keyboard';
export { ThemeManager, themeManager, lightTheme, darkTheme } from './theme';
export { ValidationManager, validationManager } from './validation';
export type { ValidationResult } from './validation';

// Utility functions
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

export function generateId(prefix: string = ''): string {
  return `${prefix}${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getFileTypeIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎥';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  if (mimeType.includes('text')) return '📝';
  return '📎';
}

export function sanitizeHtml(html: string): string {
  // Basic HTML sanitization - remove script tags and dangerous attributes
  return html
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<iframe[^>]*>.*?<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    return navigator.clipboard.writeText(text)
      .then(() => true)
      .catch(() => false);
  }
  
  // Fallback for older browsers
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.width = '2em';
    textArea.style.height = '2em';
    textArea.style.padding = '0';
    textArea.style.border = 'none';
    textArea.style.outline = 'none';
    textArea.style.boxShadow = 'none';
    textArea.style.background = 'transparent';
    document.body.appendChild(textArea);
    textArea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textArea);
    return Promise.resolve(success);
  } catch {
    return Promise.resolve(false);
  }
}

export function downloadJson(data: any, filename: string = 'bug-report.json'): void {
  try {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to download JSON:', error);
  }
}

export function loadFromStorage(key: string, defaultValue: any = null): any {
  if (typeof window === 'undefined' || !window.localStorage) {
    return defaultValue;
  }
  
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

export function saveToStorage(key: string, value: any): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function removeFromStorage(key: string): boolean {
  if (typeof window === 'undefined' || !window.localStorage) {
    return false;
  }
  
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

export function isSSR(): boolean {
  return typeof window === 'undefined';
}

export function createMarkdownFromReport(data: any): string {
  const sections: string[] = [];

  sections.push(`# ${data.title || 'Bug Report'}\n`);

  if (data.description) {
    sections.push('## Description\n');
    sections.push(`${data.description}\n`);
  }

  sections.push('## Environment\n');
  sections.push(`- **URL**: ${data.url}`);
  sections.push(`- **User Agent**: ${data.userAgent}`);
  sections.push(`- **Viewport**: ${data.viewport.width}×${data.viewport.height}`);
  sections.push(`- **Timestamp**: ${new Date(data.timestamp).toISOString()}\n`);

  if (data.consoleLogs && data.consoleLogs.length > 0) {
    sections.push('## Console Logs\n');
    sections.push('```');
    data.consoleLogs.slice(-10).forEach((log: any) => {
      sections.push(`[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}`);
    });
    sections.push('```\n');
  }

  if (data.networkRequests && data.networkRequests.length > 0) {
    sections.push('## Network Requests\n');
    sections.push('| Method | URL | Status | Duration |');
    sections.push('|--------|-----|--------|----------|');
    data.networkRequests.slice(-10).forEach((req: any) => {
      sections.push(`| ${req.method} | ${req.url} | ${req.status || 'N/A'} | ${req.duration || 'N/A'}ms |`);
    });
    sections.push('');
  }

  return sections.join('\n');
}