import html2canvas from 'html2canvas';
import {
  BugReportData,
  ConsoleLogEntry,
  NetworkRequestEntry,
  CaptureOptions
} from '../types';

class BugReportCapture {
  private consoleLogs: ConsoleLogEntry[] = [];
  private networkRequests: NetworkRequestEntry[] = [];
  private isCapturing = false;
  private options: CaptureOptions;
  private originalFetch?: typeof fetch;
  private originalXhrOpen?: typeof XMLHttpRequest.prototype.open;
  private originalConsoleMethods: { [key: string]: Function } = {};
  private startTime: number = Date.now();

  constructor(options?: Partial<CaptureOptions>) {
    this.options = {
      maxConsoleLogs: 50,
      maxNetworkRequests: 25,
      sensitiveParams: ['token', 'key', 'secret', 'password', 'auth', 'authorization', 'api-key', 'apikey'],
      excludeUrls: [],
      includeRequestHeaders: false,
      includeResponseHeaders: false,
      ...options
    };
  }

  updateOptions(options: Partial<CaptureOptions>) {
    this.options = { ...this.options, ...options };
  }

  startCapturing() {
    if (this.isCapturing || typeof window === 'undefined') return;
    
    this.isCapturing = true;
    this.startTime = Date.now();
    
    // Capture console logs
    this.interceptConsole();
    
    // Capture network requests
    this.interceptNetworkRequests();

    // Capture unhandled errors
    this.interceptErrors();
  }

  stopCapturing() {
    if (!this.isCapturing) return;
    
    this.isCapturing = false;
    
    // Restore console methods
    this.restoreConsole();
    
    // Restore network interceptors
    this.restoreNetworkInterceptors();
    
    // Remove error handlers
    this.removeErrorHandlers();
  }

  private interceptConsole() {
    const methods: Array<keyof Console> = ['log', 'warn', 'error', 'info', 'debug'];
    
    methods.forEach(method => {
      if (typeof console[method] === 'function') {
        this.originalConsoleMethods[method] = console[method];
        
        console[method] = (...args: any[]) => {
          // Store the log
          this.addConsoleLog({
            timestamp: Date.now(),
            level: method as any,
            message: args.map(arg => this.serializeArg(arg)).join(' '),
            args: args.map(arg => this.serializeArg(arg)),
            source: this.getCallerInfo()
          });
          
          // Call original method
          this.originalConsoleMethods[method].apply(console, args);
        };
      }
    });
  }

  private restoreConsole() {
    Object.keys(this.originalConsoleMethods).forEach(method => {
      (console as any)[method] = this.originalConsoleMethods[method];
    });
    this.originalConsoleMethods = {};
  }

  private interceptNetworkRequests() {
    if (typeof window === 'undefined') return;
    
    // Intercept fetch
    this.originalFetch = window.fetch.bind(window);
    const self = this;
    
    window.fetch = async function(...args: Parameters<typeof fetch>) {
      const startTime = Date.now();
      const [input, init] = args;
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      const method = init?.method || (input instanceof Request ? input.method : 'GET');
      
      // Skip if URL should be excluded
      if (self.shouldExcludeUrl(url)) {
        return await self.originalFetch!(...args);
      }
      
      const requestHeaders = self.options.includeRequestHeaders 
        ? self.extractHeaders(init?.headers || (input instanceof Request ? input.headers : undefined))
        : undefined;
      
      try {
        const response = await self.originalFetch!(...args);
        
        const responseHeaders = self.options.includeResponseHeaders
          ? self.headersToObject(response.headers)
          : undefined;
        
        self.addNetworkRequest({
          timestamp: startTime,
          method,
          url: self.sanitizeUrl(url),
          status: response.status,
          duration: Date.now() - startTime,
          size: self.getResponseSize(response),
          requestHeaders,
          responseHeaders
        });
        
        return response;
      } catch (error) {
        self.addNetworkRequest({
          timestamp: startTime,
          method,
          url: self.sanitizeUrl(url),
          status: 0,
          duration: Date.now() - startTime,
          error: error instanceof Error ? error.message : 'Network error',
          requestHeaders
        });
        throw error;
      }
    };

    // Intercept XHR
    this.originalXhrOpen = XMLHttpRequest.prototype.open;
    
    XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
      const xhr = this;
      const startTime = Date.now();
      const urlString = url.toString();
      
      if (!self.shouldExcludeUrl(urlString)) {
        xhr.addEventListener('loadend', () => {
          const requestHeaders = self.options.includeRequestHeaders
            ? self.getXHRRequestHeaders(xhr)
            : undefined;
          
          const responseHeaders = self.options.includeResponseHeaders
            ? self.getXHRResponseHeaders(xhr)
            : undefined;
          
          self.addNetworkRequest({
            timestamp: startTime,
            method,
            url: self.sanitizeUrl(urlString),
            status: xhr.status,
            duration: Date.now() - startTime,
            size: self.getXHRResponseSize(xhr),
            requestHeaders,
            responseHeaders,
            error: xhr.status === 0 ? 'Network error' : undefined
          });
        });
      }
      
      return self.originalXhrOpen!.apply(this, [method, url, ...args] as any);
    };
  }

  private restoreNetworkInterceptors() {
    if (this.originalFetch && typeof window !== 'undefined') {
      window.fetch = this.originalFetch;
      this.originalFetch = undefined;
    }
    
    if (this.originalXhrOpen) {
      XMLHttpRequest.prototype.open = this.originalXhrOpen;
      this.originalXhrOpen = undefined;
    }
  }

  private interceptErrors() {
    if (typeof window === 'undefined') return;
    
    window.addEventListener('error', this.handleError);
    window.addEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private removeErrorHandlers() {
    if (typeof window === 'undefined') return;
    
    window.removeEventListener('error', this.handleError);
    window.removeEventListener('unhandledrejection', this.handleUnhandledRejection);
  }

  private handleError = (event: ErrorEvent) => {
    this.addConsoleLog({
      timestamp: Date.now(),
      level: 'error',
      message: `Uncaught Error: ${event.message}`,
      args: [event.error],
      source: `${event.filename}:${event.lineno}:${event.colno}`
    });
  };

  private handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    this.addConsoleLog({
      timestamp: Date.now(),
      level: 'error',
      message: `Unhandled Promise Rejection: ${event.reason}`,
      args: [event.reason],
      source: 'Promise rejection'
    });
  };

  private addConsoleLog(entry: ConsoleLogEntry) {
    this.consoleLogs.push(entry);
    
    // Keep only the last N logs
    if (this.consoleLogs.length > this.options.maxConsoleLogs) {
      this.consoleLogs = this.consoleLogs.slice(-this.options.maxConsoleLogs);
    }
  }

  private addNetworkRequest(request: NetworkRequestEntry) {
    this.networkRequests.push(request);
    
    // Keep only the last N requests
    if (this.networkRequests.length > this.options.maxNetworkRequests) {
      this.networkRequests = this.networkRequests.slice(-this.options.maxNetworkRequests);
    }
  }

  private shouldExcludeUrl(url: string): boolean {
    return this.options.excludeUrls.some(pattern => pattern.test(url));
  }

  private sanitizeUrl(url: string): string {
    try {
      const urlObj = new URL(url, window.location.origin);
      
      // Remove sensitive query parameters
      this.options.sensitiveParams.forEach(param => {
        if (urlObj.searchParams.has(param)) {
          urlObj.searchParams.set(param, '[REDACTED]');
        }
      });
      
      return urlObj.toString();
    } catch {
      return url;
    }
  }

  private serializeArg(arg: any): any {
    try {
      if (arg === null || arg === undefined) return arg;
      if (typeof arg === 'function') return '[Function]';
      if (arg instanceof Error) {
        return {
          name: arg.name,
          message: arg.message,
          stack: arg.stack
        };
      }
      if (typeof arg === 'object') {
        // Avoid circular references and deeply nested objects
        return JSON.parse(JSON.stringify(arg, null, 0));
      }
      return arg;
    } catch {
      return '[Unserializable]';
    }
  }

  private getCallerInfo(): string {
    try {
      const stack = new Error().stack;
      if (!stack) return '';
      
      const lines = stack.split('\n');
      // Skip the first few lines (this function, console method, etc.)
      for (let i = 3; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line.includes('console') && !line.includes('capture.ts')) {
          return line.replace(/^\s*at\s+/, '');
        }
      }
      return '';
    } catch {
      return '';
    }
  }

  private extractHeaders(headers: any): Record<string, string> | undefined {
    if (!headers) return undefined;
    
    const result: Record<string, string> = {};
    
    if (headers instanceof Headers) {
      headers.forEach((value, key) => {
        if (!this.isSensitiveHeader(key)) {
          result[key] = value;
        }
      });
    } else if (typeof headers === 'object') {
      Object.entries(headers).forEach(([key, value]) => {
        if (!this.isSensitiveHeader(key) && typeof value === 'string') {
          result[key] = value;
        }
      });
    }
    
    return Object.keys(result).length > 0 ? result : undefined;
  }

  private headersToObject(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      if (!this.isSensitiveHeader(key)) {
        result[key] = value;
      }
    });
    return result;
  }

  private getXHRRequestHeaders(xhr: XMLHttpRequest): Record<string, string> | undefined {
    // XMLHttpRequest doesn't provide a way to get request headers after sending
    return undefined;
  }

  private getXHRResponseHeaders(xhr: XMLHttpRequest): Record<string, string> | undefined {
    try {
      const headers = xhr.getAllResponseHeaders();
      if (!headers) return undefined;
      
      const result: Record<string, string> = {};
      headers.split('\r\n').forEach(line => {
        const [key, ...valueParts] = line.split(': ');
        if (key && valueParts.length > 0 && !this.isSensitiveHeader(key)) {
          result[key] = valueParts.join(': ');
        }
      });
      
      return Object.keys(result).length > 0 ? result : undefined;
    } catch {
      return undefined;
    }
  }

  private isSensitiveHeader(name: string): boolean {
    const lowerName = name.toLowerCase();
    return this.options.sensitiveParams.some(param => 
      lowerName.includes(param.toLowerCase()) || lowerName === 'authorization' || lowerName === 'cookie'
    );
  }

  private getResponseSize(response: Response): number | undefined {
    const contentLength = response.headers.get('content-length');
    return contentLength ? parseInt(contentLength, 10) : undefined;
  }

  private getXHRResponseSize(xhr: XMLHttpRequest): number | undefined {
    try {
      const contentLength = xhr.getResponseHeader('content-length');
      return contentLength ? parseInt(contentLength, 10) : undefined;
    } catch {
      return undefined;
    }
  }

  async captureScreenshot(options?: {
    excludeSelectors?: string[];
    scale?: number;
    format?: 'png' | 'jpeg';
    quality?: number;
    captureViewport?: boolean;
  }): Promise<string | undefined> {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return undefined;
    }
    
    try {
      const defaultExcludeSelectors = [
        '[data-private]',
        '[data-bug-reporter-hide]',
        '[data-bug-reporter-widget]',
        '.br-bug-reporter',
        '.bug-reporter-popup'
      ];
      
      const excludeSelectors = [
        ...defaultExcludeSelectors,
        ...(options?.excludeSelectors || [])
      ];
      
      // Find elements to exclude from screenshot
      const elementsToHide = document.querySelectorAll(excludeSelectors.join(', '));
      const originalStyles: Map<Element, string> = new Map();
      
      // Hide private elements
      elementsToHide.forEach(el => {
        const htmlEl = el as HTMLElement;
        originalStyles.set(el, htmlEl.style.display);
        htmlEl.style.display = 'none';
      });
      
      // Capture screenshot
      const canvas = await html2canvas(document.body, {
        useCORS: true,
        allowTaint: false,
        scale: options?.scale || 0.8,
        logging: false,
        width: options?.captureViewport ? window.innerWidth : undefined,
        height: options?.captureViewport ? window.innerHeight : undefined,
        windowWidth: window.innerWidth,
        windowHeight: window.innerHeight,
        scrollX: 0,
        scrollY: 0
      });
      
      // Restore hidden elements
      elementsToHide.forEach(el => {
        const htmlEl = el as HTMLElement;
        htmlEl.style.display = originalStyles.get(el) || '';
      });
      
      const format = options?.format || 'png';
      const quality = options?.quality || 0.8;
      
      return canvas.toDataURL(`image/${format}`, format === 'jpeg' ? quality : undefined);
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
      return undefined;
    }
  }

  async captureReport(additionalData?: Partial<BugReportData>): Promise<BugReportData> {
    const screenshot = await this.captureScreenshot();
    
    // Provide defaults for SSR
    const defaultData: BugReportData = {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      viewport: {
        width: typeof window !== 'undefined' ? window.innerWidth : 0,
        height: typeof window !== 'undefined' ? window.innerHeight : 0
      },
      consoleLogs: [...this.consoleLogs],
      networkRequests: [...this.networkRequests],
      screenshot,
      ...additionalData
    };
    
    return defaultData;
  }

  clearLogs() {
    this.consoleLogs = [];
    this.networkRequests = [];
  }

  getConsoleLogs(): ConsoleLogEntry[] {
    return [...this.consoleLogs];
  }

  getNetworkRequests(): NetworkRequestEntry[] {
    return [...this.networkRequests];
  }

  isCurrentlyCapturing(): boolean {
    return this.isCapturing;
  }

  getCaptureStartTime(): number {
    return this.startTime;
  }
}

// Create singleton instance
export const bugReportCapture = new BugReportCapture();
export { BugReportCapture };