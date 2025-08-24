import { BugReportData, BugReporterConfig } from '../types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class ValidationManager {
  validateBugReport(data: Partial<BugReportData>, config: BugReporterConfig): ValidationResult {
    const errors: string[] = [];

    // Required field validation
    if (config.validation?.requireTitle && !data.title?.trim()) {
      errors.push('Title is required');
    }

    if (config.validation?.requireDescription && !data.description?.trim()) {
      errors.push('Description is required');
    }

    if (config.validation?.requireEmail && !data.userEmail?.trim()) {
      errors.push('Email is required');
    }

    // Email format validation
    if (data.userEmail && !this.isValidEmail(data.userEmail)) {
      errors.push('Please enter a valid email address');
    }

    // URL validation
    if (data.url && !this.isValidUrl(data.url)) {
      errors.push('Invalid URL format');
    }

    // Custom field validation
    if (config.ui?.fields) {
      const fieldErrors = this.validateCustomFields(data, config.ui.fields);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateFile(file: File, config: BugReporterConfig): ValidationResult {
    const errors: string[] = [];
    const validation = config.validation;

    if (!validation) {
      return { isValid: true, errors: [] };
    }

    // File size validation
    if (validation.maxFileSize && file.size > validation.maxFileSize) {
      const maxSizeMB = (validation.maxFileSize / 1024 / 1024).toFixed(1);
      const fileSizeMB = (file.size / 1024 / 1024).toFixed(1);
      errors.push(`File "${file.name}" is too large (${fileSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB.`);
    }

    // File type validation
    if (validation.allowedFileTypes && validation.allowedFileTypes.length > 0) {
      const isAllowed = validation.allowedFileTypes.some(type => {
        if (type.startsWith('.')) {
          // Extension check
          return file.name.toLowerCase().endsWith(type.toLowerCase());
        } else if (type.includes('/')) {
          // MIME type check
          return file.type.startsWith(type);
        } else {
          // Category check (e.g., 'image', 'video')
          return file.type.startsWith(`${type}/`);
        }
      });

      if (!isAllowed) {
        errors.push(`File type "${file.type}" is not allowed for file "${file.name}".`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateMultipleFiles(files: File[], config: BugReporterConfig): ValidationResult {
    const errors: string[] = [];
    const validation = config.validation;

    // Check total file count
    if (validation?.maxFiles && files.length > validation.maxFiles) {
      errors.push(`Too many files. Maximum allowed is ${validation.maxFiles}.`);
    }

    // Validate each file
    files.forEach(file => {
      const fileValidation = this.validateFile(file, config);
      if (!fileValidation.isValid) {
        errors.push(...fileValidation.errors);
      }
    });

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  validateConfig(config: BugReporterConfig): ValidationResult {
    const errors: string[] = [];

    // Integration validation
    if (config.integrations) {
      Object.entries(config.integrations).forEach(([name, integrationConfig]) => {
        if (integrationConfig) {
          const validationResult = this.validateIntegrationConfig(name, integrationConfig);
          if (!validationResult.isValid) {
            errors.push(`${name} integration: ${validationResult.errors.join(', ')}`);
          }
        }
      });
    }

    // UI validation
    if (config.ui) {
      const uiErrors = this.validateUIConfig(config.ui);
      errors.push(...uiErrors);
    }

    // Capture validation
    if (config.capture) {
      const captureErrors = this.validateCaptureConfig(config.capture);
      errors.push(...captureErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateCustomFields(data: Partial<BugReportData>, fields: any[]): string[] {
    const errors: string[] = [];

    fields.forEach(field => {
      const value = (data as any)[field.key];
      
      if (field.required && !value) {
        errors.push(`${field.label} is required`);
        return;
      }

      if (value && field.validation) {
        const fieldErrors = this.validateFieldValue(value, field.validation, field.label);
        errors.push(...fieldErrors);
      }
    });

    return errors;
  }

  private validateFieldValue(value: any, validation: any, fieldLabel: string): string[] {
    const errors: string[] = [];

    if (validation.min !== undefined) {
      if (typeof value === 'string' && value.length < validation.min) {
        errors.push(`${fieldLabel} must be at least ${validation.min} characters long`);
      } else if (typeof value === 'number' && value < validation.min) {
        errors.push(`${fieldLabel} must be at least ${validation.min}`);
      }
    }

    if (validation.max !== undefined) {
      if (typeof value === 'string' && value.length > validation.max) {
        errors.push(`${fieldLabel} must be no more than ${validation.max} characters long`);
      } else if (typeof value === 'number' && value > validation.max) {
        errors.push(`${fieldLabel} must be no more than ${validation.max}`);
      }
    }

    if (validation.pattern && typeof value === 'string') {
      if (!validation.pattern.test(value)) {
        errors.push(validation.message || `${fieldLabel} format is invalid`);
      }
    }

    return errors;
  }

  private validateIntegrationConfig(name: string, config: any): ValidationResult {
    const errors: string[] = [];

    switch (name) {
      case 'github':
        if (!config.repo || !config.token) {
          errors.push('repo and token are required');
        } else if (!config.repo.includes('/')) {
          errors.push('repo must be in format "owner/repository"');
        }
        break;

      case 'linear':
        if (!config.apiKey || !config.teamId) {
          errors.push('apiKey and teamId are required');
        }
        if (config.priority !== undefined && (config.priority < 0 || config.priority > 4)) {
          errors.push('priority must be between 0 and 4');
        }
        break;

      case 'webhook':
        if (!config.url) {
          errors.push('url is required');
        } else if (!this.isValidUrl(config.url)) {
          errors.push('url must be a valid URL');
        }
        break;

      case 'slack':
        if (!config.webhook) {
          errors.push('webhook URL is required');
        } else if (!config.webhook.includes('hooks.slack.com')) {
          errors.push('invalid Slack webhook URL');
        }
        break;

      case 'discord':
        if (!config.webhook) {
          errors.push('webhook URL is required');
        } else if (!config.webhook.includes('discord.com/api/webhooks')) {
          errors.push('invalid Discord webhook URL');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private validateUIConfig(uiConfig: any): string[] {
    const errors: string[] = [];

    if (uiConfig.position && !['bottom-right', 'bottom-left', 'top-right', 'top-left'].includes(uiConfig.position)) {
      errors.push('position must be one of: bottom-right, bottom-left, top-right, top-left');
    }

    if (uiConfig.theme && !['light', 'dark', 'auto'].includes(uiConfig.theme)) {
      errors.push('theme must be one of: light, dark, auto');
    }

    if (uiConfig.primaryColor && !this.isValidColor(uiConfig.primaryColor)) {
      errors.push('primaryColor must be a valid CSS color');
    }

    return errors;
  }

  private validateCaptureConfig(captureConfig: any): string[] {
    const errors: string[] = [];

    if (captureConfig.maxConsoleLogs !== undefined && (captureConfig.maxConsoleLogs < 0 || captureConfig.maxConsoleLogs > 1000)) {
      errors.push('maxConsoleLogs must be between 0 and 1000');
    }

    if (captureConfig.maxNetworkRequests !== undefined && (captureConfig.maxNetworkRequests < 0 || captureConfig.maxNetworkRequests > 1000)) {
      errors.push('maxNetworkRequests must be between 0 and 1000');
    }

    if (captureConfig.screenshotScale !== undefined && (captureConfig.screenshotScale <= 0 || captureConfig.screenshotScale > 2)) {
      errors.push('screenshotScale must be between 0 and 2');
    }

    if (captureConfig.screenshotQuality !== undefined && (captureConfig.screenshotQuality < 0 || captureConfig.screenshotQuality > 1)) {
      errors.push('screenshotQuality must be between 0 and 1');
    }

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidColor(color: string): boolean {
    // Simple CSS color validation (hex, rgb, hsl, named colors)
    const colorRegex = /^(#[0-9A-F]{6}|#[0-9A-F]{3}|rgb\([\d\s,]+\)|rgba\([\d\s,.]+\)|hsl\([\d\s,%]+\)|hsla\([\d\s,%.]+\)|[a-z]+)$/i;
    return colorRegex.test(color);
  }
}

export const validationManager = new ValidationManager();