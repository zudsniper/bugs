export interface BugReportData {
  timestamp: number;
  url: string;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  consoleLogs: ConsoleLogEntry[];
  networkRequests: NetworkRequestEntry[];
  screenshot?: string;
  userId?: string;
  userEmail?: string;
  title?: string;
  description?: string;
  additionalFiles?: AttachedFile[];
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  reproductionSteps?: string[];
  expectedBehavior?: string;
  actualBehavior?: string;
}

export interface ConsoleLogEntry {
  timestamp: number;
  level: 'log' | 'warn' | 'error' | 'info' | 'debug';
  message: string;
  args: any[];
  source?: string;
}

export interface NetworkRequestEntry {
  timestamp: number;
  method: string;
  url: string;
  status?: number;
  duration?: number;
  size?: number;
  requestHeaders?: Record<string, string>;
  responseHeaders?: Record<string, string>;
  error?: string;
}

export interface AttachedFile {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
  thumbnailUrl?: string;
}

export interface Field {
  type: 'text' | 'email' | 'select' | 'textarea' | 'checkbox' | 'file' | 'url' | 'number';
  key: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    min?: number;
    max?: number;
    pattern?: RegExp;
    message?: string;
  };
}

// Integration mode types
type DirectIntegrationMode = 'direct';
type ProxyIntegrationMode = 'proxy';
type IntegrationMode = DirectIntegrationMode | ProxyIntegrationMode;

// Base integration configs
interface BaseIntegrationConfig {
  mode?: IntegrationMode;
}

interface GitHubDirectConfig extends BaseIntegrationConfig {
  mode?: 'direct';
  repo: string;
  token: string;
  labels?: string[];
  assignees?: string[];
  projects?: string[];
  milestone?: string;
  issueTemplate?: string;
}

interface GitHubProxyConfig extends BaseIntegrationConfig {
  mode: 'proxy';
  endpoint: string;
  // Optional client-side overrides
  labels?: string[];
  assignees?: string[];
  projects?: string[];
  milestone?: string;
  issueTemplate?: string;
}

interface LinearDirectConfig extends BaseIntegrationConfig {
  mode?: 'direct';
  apiKey: string;
  teamId: string;
  projectId?: string;
  labels?: string[];
  assigneeId?: string;
  priority?: number;
  estimate?: number;
}

interface LinearProxyConfig extends BaseIntegrationConfig {
  mode: 'proxy';
  endpoint: string;
  // Optional client-side overrides
  projectId?: string;
  labels?: string[];
  assigneeId?: string;
  priority?: number;
  estimate?: number;
}

export interface BugReporterConfig {
  integrations?: {
    github?: GitHubDirectConfig | GitHubProxyConfig;
    linear?: LinearDirectConfig | LinearProxyConfig;
    jira?: {
      mode?: IntegrationMode;
      url: string;
      username: string;
      token: string;
      projectKey: string;
      issueType?: string;
      components?: string[];
      fixVersions?: string[];
      priority?: string;
    } | {
      mode: 'proxy';
      endpoint: string;
      projectKey?: string;
      issueType?: string;
      components?: string[];
      fixVersions?: string[];
      priority?: string;
    };
    slack?: {
      mode?: 'direct';
      webhook: string;
      channel?: string;
      username?: string;
      iconEmoji?: string;
    } | {
      mode: 'proxy';
      endpoint: string;
      channel?: string;
      username?: string;
      iconEmoji?: string;
    };
    discord?: {
      mode?: 'direct';
      webhook: string;
      username?: string;
      avatar?: string;
    } | {
      mode: 'proxy';
      endpoint: string;
      username?: string;
      avatar?: string;
    };
    webhook?: {
      mode?: 'direct';
      url: string;
      headers?: Record<string, string>;
      method?: 'POST' | 'PUT' | 'PATCH';
      auth?: {
        type: 'bearer' | 'basic' | 'api-key';
        token: string;
        header?: string;
      };
    } | {
      mode: 'proxy';
      endpoint: string;
      headers?: Record<string, string>;
      method?: 'POST' | 'PUT' | 'PATCH';
    };
    email?: {
      to: string;
      from?: string;
      subject?: string;
      smtpConfig?: {
        host: string;
        port: number;
        secure: boolean;
        auth: {
          user: string;
          pass: string;
        };
      };
    };
  };
  ui?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    theme?: 'light' | 'dark' | 'auto';
    primaryColor?: string;
    showScreenshot?: boolean;
    showConsole?: boolean;
    showNetwork?: boolean;
    showUserInfo?: boolean;
    fields?: Field[];
    customStyles?: Record<string, string>;
    title?: string;
    subtitle?: string;
    submitButtonText?: string;
    closeButtonText?: string;
    thankYouMessage?: string;
    errorMessage?: string;
    loadingMessage?: string;
    triggerComponent?: React.ComponentType<any>;
  };
  capture?: {
    maxConsoleLogs?: number;
    maxNetworkRequests?: number;
    captureScreenshot?: boolean;
    screenshotFormat?: 'png' | 'jpeg';
    screenshotQuality?: number;
    screenshotScale?: number;
    captureViewport?: boolean;
    captureFullPage?: boolean;
    sensitiveParams?: string[];
    excludeUrls?: RegExp[];
    includeRequestHeaders?: boolean;
    includeResponseHeaders?: boolean;
    enableSessionRecording?: boolean;
    sessionRecordingDuration?: number;
  };
  privacy?: {
    excludeSelectors?: string[];
    redactSelectors?: string[];
    redactPatterns?: RegExp[];
    anonymizeUrls?: boolean;
    anonymizeEmails?: boolean;
    requireUserConsent?: boolean;
    consentMessage?: string;
    dataRetentionDays?: number;
    allowScreenshots?: boolean;
    allowConsoleLogs?: boolean;
    allowNetworkLogs?: boolean;
  };
  keyboard?: {
    openShortcut?: string[];
    submitShortcut?: string[];
    closeShortcut?: string[];
  };
  validation?: {
    requireTitle?: boolean;
    requireDescription?: boolean;
    requireEmail?: boolean;
    maxFileSize?: number;
    allowedFileTypes?: string[];
    maxFiles?: number;
  };
  advanced?: {
    autoSubmit?: boolean;
    debounceMs?: number;
    enableOfflineMode?: boolean;
    enableAnalytics?: boolean;
    customLogger?: (level: string, message: string, data?: any) => void;
    onBugReport?: (data: BugReportData) => void;
    onSubmitSuccess?: (response: any) => void;
    onSubmitError?: (error: Error) => void;
    transformData?: (data: BugReportData) => BugReportData;
  };
}

export interface SubmissionResponse {
  success: boolean;
  issueId?: string;
  issueUrl?: string;
  message?: string;
  error?: string;
}

export interface IntegrationAdapter {
  name: string;
  submit: (data: BugReportData, config: any) => Promise<SubmissionResponse>;
  validateConfig: (config: any) => boolean;
  getConfigSchema?: () => object;
}

export interface CaptureOptions {
  maxConsoleLogs: number;
  maxNetworkRequests: number;
  sensitiveParams: string[];
  excludeUrls: RegExp[];
  includeRequestHeaders: boolean;
  includeResponseHeaders: boolean;
}

export interface UploadingFile {
  id: string;
  name: string;
  placeholder: string;
  status: 'uploading' | 'success' | 'error';
  url?: string;
  errorMessage?: string;
  progress?: number;
}

export interface Position {
  x: number;
  y: number;
}

export interface Theme {
  name: 'light' | 'dark' | 'auto';
  colors: {
    primary: string;
    secondary: string;
    background: string;
    foreground: string;
    muted: string;
    border: string;
    error: string;
    success: string;
    warning: string;
  };
  borderRadius: string;
  shadows: {
    sm: string;
    md: string;
    lg: string;
  };
}

// Re-export React types for convenience
export type { ComponentType, ReactNode } from 'react';