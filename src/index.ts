// Main exports
export { BugReporter } from './components/BugReporter';
export type { BugReporterProps } from './components/BugReporter';

// Core functionality
export { bugReportCapture, BugReportCapture } from './core/capture';

// Integrations
export {
  BaseIntegration,
  GitHubIntegration,
  LinearIntegration,
  WebhookIntegration,
  SlackIntegration,
  DiscordIntegration,
  integrations
} from './integrations';

// Components (for advanced usage)
export {
  FloatingTrigger,
  ReportPopup,
  FormField,
  FileUpload,
  ScreenshotPreview,
  ThanksMessage
} from './components';

// Utilities
export {
  KeyboardManager,
  keyboardManager,
  ThemeManager,
  themeManager,
  lightTheme,
  darkTheme,
  ValidationManager,
  validationManager,
  debounce,
  throttle,
  generateId,
  formatFileSize,
  getFileTypeIcon,
  sanitizeHtml,
  truncateText,
  copyToClipboard,
  downloadJson,
  loadFromStorage,
  saveToStorage,
  removeFromStorage,
  isSSR,
  createMarkdownFromReport
} from './utils';

// Types
export type {
  BugReportData,
  ConsoleLogEntry,
  NetworkRequestEntry,
  AttachedFile,
  Field,
  BugReporterConfig,
  SubmissionResponse,
  IntegrationAdapter,
  CaptureOptions,
  UploadingFile,
  Position,
  Theme,
  ValidationResult,
  ComponentType,
  ReactNode
} from './types';

// Default configurations for common use cases
export const defaultConfigs = {
  // GitHub Issues integration (direct mode - for development only)
  github: (repo: string, token: string): BugReporterConfig => ({
    integrations: {
      github: {
        mode: 'direct',
        repo,
        token,
        labels: ['bug', 'bug-reporter']
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report a Bug',
      submitButtonText: 'Create GitHub Issue'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 50,
      maxNetworkRequests: 25
    }
  }),

  // GitHub Issues integration (secure proxy mode - recommended for production)
  githubProxy: (endpoint: string = '/api/bug-report/github'): BugReporterConfig => ({
    integrations: {
      github: {
        mode: 'proxy',
        endpoint,
        labels: ['bug', 'user-report']
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report a Bug',
      submitButtonText: 'Create GitHub Issue'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 50,
      maxNetworkRequests: 25
    }
  }),

  // Linear integration (direct mode - for development only)
  linear: (apiKey: string, teamId: string): BugReporterConfig => ({
    integrations: {
      linear: {
        mode: 'direct',
        apiKey,
        teamId,
        priority: 3 // Medium priority
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report an Issue',
      submitButtonText: 'Create Linear Issue'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 30,
      maxNetworkRequests: 20
    }
  }),

  // Linear integration (secure proxy mode - recommended for production)
  linearProxy: (endpoint: string = '/api/bug-report/linear'): BugReporterConfig => ({
    integrations: {
      linear: {
        mode: 'proxy',
        endpoint,
        priority: 3
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report an Issue',
      submitButtonText: 'Create Linear Issue'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 30,
      maxNetworkRequests: 20
    }
  }),

  // Webhook integration (direct mode - for development only)
  webhook: (url: string, headers?: Record<string, string>): BugReporterConfig => ({
    integrations: {
      webhook: {
        mode: 'direct',
        url,
        headers,
        method: 'POST'
      }
    },
    ui: {
      theme: 'auto',
      title: 'Send Feedback',
      submitButtonText: 'Submit Report'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 25,
      maxNetworkRequests: 15
    }
  }),

  // Webhook integration (secure proxy mode - recommended for production)
  webhookProxy: (endpoint: string = '/api/bug-report/webhook'): BugReporterConfig => ({
    integrations: {
      webhook: {
        mode: 'proxy',
        endpoint,
        method: 'POST'
      }
    },
    ui: {
      theme: 'auto',
      title: 'Send Feedback',
      submitButtonText: 'Submit Report'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 25,
      maxNetworkRequests: 15
    }
  }),

  // Slack integration (direct mode - for development only)
  slack: (webhook: string, channel?: string): BugReporterConfig => ({
    integrations: {
      slack: {
        mode: 'direct',
        webhook,
        channel,
        username: 'Bug Reporter',
        iconEmoji: ':bug:'
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report to Team',
      submitButtonText: 'Send to Slack'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 20,
      maxNetworkRequests: 10
    }
  }),

  // Slack integration (secure proxy mode - recommended for production)  
  slackProxy: (endpoint: string = '/api/bug-report/slack'): BugReporterConfig => ({
    integrations: {
      slack: {
        mode: 'proxy',
        endpoint,
        username: 'Bug Reporter',
        iconEmoji: ':bug:'
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report to Team',
      submitButtonText: 'Send to Slack'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 20,
      maxNetworkRequests: 10
    }
  }),

  // Discord integration (direct mode - for development only)
  discord: (webhook: string): BugReporterConfig => ({
    integrations: {
      discord: {
        mode: 'direct',
        webhook,
        username: 'Bug Reporter'
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report Issue',
      submitButtonText: 'Send to Discord'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 20,
      maxNetworkRequests: 10
    }
  }),

  // Discord integration (secure proxy mode - recommended for production)
  discordProxy: (endpoint: string = '/api/bug-report/discord'): BugReporterConfig => ({
    integrations: {
      discord: {
        mode: 'proxy',
        endpoint,
        username: 'Bug Reporter'
      }
    },
    ui: {
      theme: 'auto',
      title: 'Report Issue',
      submitButtonText: 'Send to Discord'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 20,
      maxNetworkRequests: 10
    }
  }),

  // Email integration
  email: (to: string, smtpConfig?: any): BugReporterConfig => ({
    integrations: {
      email: {
        to,
        subject: 'Bug Report',
        smtpConfig
      }
    },
    ui: {
      theme: 'auto',
      title: 'Email Bug Report',
      submitButtonText: 'Send Email'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 30,
      maxNetworkRequests: 20
    }
  }),

  // Privacy-focused configuration
  privacy: (): Partial<BugReporterConfig> => ({
    privacy: {
      excludeSelectors: [
        '[data-private]',
        '[data-sensitive]',
        '.password',
        '.credit-card',
        '.social-security'
      ],
      redactPatterns: [
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
        /\b\d{3}-\d{2}-\d{4}\b/g, // SSN
        /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g // credit cards
      ],
      requireUserConsent: true,
      allowScreenshots: true,
      allowConsoleLogs: false,
      allowNetworkLogs: false
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 0,
      maxNetworkRequests: 0,
      sensitiveParams: [
        'password', 'pwd', 'pass', 'secret', 'token', 'key', 'auth', 
        'authorization', 'api-key', 'apikey', 'access-token', 'refresh-token',
        'session', 'cookie', 'csrf', 'xsrf'
      ]
    }
  }),

  // Development/debugging configuration
  development: (): Partial<BugReporterConfig> => ({
    ui: {
      showConsole: true,
      showNetwork: true,
      showScreenshot: true
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 100,
      maxNetworkRequests: 50,
      includeRequestHeaders: true,
      includeResponseHeaders: true
    },
    advanced: {
      enableAnalytics: true,
      customLogger: (level, message, data) => {
        console.log(`[BugReporter:${level}] ${message}`, data);
      }
    }
  }),

  // Production-ready configuration
  production: (): Partial<BugReporterConfig> => ({
    ui: {
      showConsole: false,
      showNetwork: false,
      theme: 'auto'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 25,
      maxNetworkRequests: 15,
      includeRequestHeaders: false,
      includeResponseHeaders: false,
      sensitiveParams: [
        'token', 'key', 'secret', 'password', 'auth', 'authorization', 
        'api-key', 'apikey', 'session', 'cookie'
      ]
    },
    privacy: {
      excludeSelectors: ['[data-private]'],
      anonymizeUrls: true,
      anonymizeEmails: true
    },
    validation: {
      requireTitle: true,
      requireDescription: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedFileTypes: ['image/', 'text/'],
      maxFiles: 3
    }
  })
};

// Helper function to merge configurations
export function mergeConfigs(...configs: (BugReporterConfig | Partial<BugReporterConfig>)[]): BugReporterConfig {
  const result: any = {};
  
  for (const config of configs) {
    for (const [key, value] of Object.entries(config)) {
      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        result[key] = { ...(result[key] || {}), ...value };
      } else {
        result[key] = value;
      }
    }
  }
  
  return result;
}

// Version
export const version = '1.0.0';