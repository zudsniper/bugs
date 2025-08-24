import { BaseIntegration } from './base';
import { BugReportData, SubmissionResponse } from '../types';

interface WebhookConfig {
  url: string;
  headers?: Record<string, string>;
  method?: 'POST' | 'PUT' | 'PATCH';
  auth?: {
    type: 'bearer' | 'basic' | 'api-key';
    token: string;
    header?: string; // Custom header name for api-key type
  };
  timeout?: number;
  retries?: number;
  transformPayload?: (data: BugReportData) => any;
}

export class WebhookIntegration extends BaseIntegration {
  name = 'webhook';

  async submit(data: BugReportData, config: WebhookConfig): Promise<SubmissionResponse> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'Invalid webhook configuration'
      };
    }

    // Handle proxy mode
    if (this.isProxyMode(config)) {
      return this.submitViaProxy(data, config.endpoint);
    }

    // Handle direct mode (traditional implementation)
    try {
      const payload = this.buildPayload(data, config);
      const headers = this.buildHeaders(config);
      
      const response = await this.makeRequest(
        config.url,
        {
          method: config.method || 'POST',
          headers,
          body: JSON.stringify(payload),
        },
        config.retries || 3
      );

      const result = await response.json().catch(() => ({}));
      
      return {
        success: true,
        issueId: result.id || result.issueId || result.ticket_id || undefined,
        issueUrl: result.url || result.link || result.issueUrl || undefined,
        message: result.message || 'Bug report submitted successfully via webhook'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit bug report via webhook'
      };
    }
  }

  private buildPayload(data: BugReportData, config: WebhookConfig): any {
    // If custom transform function is provided, use it
    if (config.transformPayload) {
      return config.transformPayload(data);
    }

    // Default payload structure
    return {
      event: 'bug_report',
      timestamp: data.timestamp,
      report: {
        title: data.title,
        description: data.description,
        url: data.url,
        userAgent: data.userAgent,
        viewport: data.viewport,
        user: {
          id: data.userId,
          email: data.userEmail
        },
        priority: data.priority,
        category: data.category,
        tags: data.tags,
        reproductionSteps: data.reproductionSteps,
        expectedBehavior: data.expectedBehavior,
        actualBehavior: data.actualBehavior,
        screenshot: data.screenshot,
        additionalFiles: data.additionalFiles,
        technical: {
          consoleLogs: data.consoleLogs.slice(-10), // Limit to recent logs
          networkRequests: data.networkRequests.slice(-10), // Limit to recent requests
        }
      }
    };
  }

  private buildHeaders(config: WebhookConfig): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...config.headers
    };

    // Add authentication headers
    if (config.auth) {
      switch (config.auth.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${config.auth.token}`;
          break;
        case 'basic':
          headers['Authorization'] = `Basic ${btoa(config.auth.token)}`;
          break;
        case 'api-key':
          const headerName = config.auth.header || 'X-API-Key';
          headers[headerName] = config.auth.token;
          break;
      }
    }

    return headers;
  }

  validateConfig(config: any): boolean {
    // Validate proxy mode
    if (config && config.mode === 'proxy') {
      return this.validateProxyConfig(config);
    }
    
    // Validate direct mode
    return !!(
      config &&
      typeof config.url === 'string' &&
      this.isValidUrl(config.url)
    );
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        url: {
          type: 'string',
          format: 'uri',
          description: 'Webhook endpoint URL'
        },
        headers: {
          type: 'object',
          additionalProperties: { type: 'string' },
          description: 'Custom headers to send with the request'
        },
        method: {
          type: 'string',
          enum: ['POST', 'PUT', 'PATCH'],
          default: 'POST',
          description: 'HTTP method to use'
        },
        auth: {
          type: 'object',
          properties: {
            type: {
              type: 'string',
              enum: ['bearer', 'basic', 'api-key'],
              description: 'Authentication type'
            },
            token: {
              type: 'string',
              description: 'Authentication token or credentials'
            },
            header: {
              type: 'string',
              description: 'Custom header name for api-key authentication'
            }
          },
          required: ['type', 'token']
        },
        timeout: {
          type: 'number',
          minimum: 1000,
          maximum: 60000,
          description: 'Request timeout in milliseconds'
        },
        retries: {
          type: 'number',
          minimum: 0,
          maximum: 5,
          default: 3,
          description: 'Number of retry attempts'
        }
      },
      required: ['url']
    };
  }
}

// Slack-specific webhook implementation
export class SlackIntegration extends BaseIntegration {
  name = 'slack';

  async submit(data: BugReportData, config: any): Promise<SubmissionResponse> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'Invalid Slack configuration'
      };
    }

    // Handle proxy mode
    if (this.isProxyMode(config)) {
      return this.submitViaProxy(data, config.endpoint);
    }

    // Handle direct mode (traditional implementation)
    try {
      const payload = this.buildSlackPayload(data, config);
      
      const response = await this.makeRequest(config.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: 'Bug report sent to Slack successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send bug report to Slack'
      };
    }
  }

  private buildSlackPayload(data: BugReportData, config: any) {
    const fields = [
      {
        title: 'URL',
        value: data.url,
        short: true
      },
      {
        title: 'User',
        value: data.userEmail || 'Anonymous',
        short: true
      },
      {
        title: 'Browser',
        value: this.extractBrowser(data.userAgent),
        short: true
      },
      {
        title: 'Viewport',
        value: `${data.viewport.width}×${data.viewport.height}`,
        short: true
      }
    ];

    if (data.consoleLogs.length > 0) {
      fields.push({
        title: 'Recent Console Logs',
        value: '```' + data.consoleLogs.slice(-3).map(log => 
          `${log.level.toUpperCase()}: ${log.message}`
        ).join('\n') + '```',
        short: false
      });
    }

    return {
      username: config.username || 'Bug Reporter',
      icon_emoji: config.iconEmoji || ':bug:',
      channel: config.channel,
      attachments: [
        {
          color: this.getPriorityColor(data.priority),
          title: data.title || 'Bug Report',
          text: data.description,
          fields,
          footer: 'Bug Reporter',
          ts: Math.floor(data.timestamp / 1000)
        }
      ]
    };
  }

  private extractBrowser(userAgent: string): string {
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getPriorityColor(priority?: string): string {
    switch (priority) {
      case 'urgent': return '#ff0000';
      case 'high': return '#ff9900';
      case 'medium': return '#ffcc00';
      case 'low': return '#00cc00';
      default: return '#808080';
    }
  }

  validateConfig(config: any): boolean {
    // Validate proxy mode
    if (config && config.mode === 'proxy') {
      return this.validateProxyConfig(config);
    }
    
    // Validate direct mode
    return !!(
      config &&
      typeof config.webhook === 'string' &&
      config.webhook.includes('hooks.slack.com')
    );
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        webhook: {
          type: 'string',
          format: 'uri',
          description: 'Slack webhook URL'
        },
        channel: {
          type: 'string',
          description: 'Slack channel to post to (optional)'
        },
        username: {
          type: 'string',
          description: 'Bot username (default: Bug Reporter)'
        },
        iconEmoji: {
          type: 'string',
          description: 'Bot icon emoji (default: :bug:)'
        }
      },
      required: ['webhook']
    };
  }
}

// Discord-specific webhook implementation
export class DiscordIntegration extends BaseIntegration {
  name = 'discord';

  async submit(data: BugReportData, config: any): Promise<SubmissionResponse> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'Invalid Discord configuration'
      };
    }

    // Handle proxy mode
    if (this.isProxyMode(config)) {
      return this.submitViaProxy(data, config.endpoint);
    }

    // Handle direct mode (traditional implementation)
    try {
      const payload = this.buildDiscordPayload(data, config);
      
      const response = await this.makeRequest(config.webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      return {
        success: true,
        message: 'Bug report sent to Discord successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send bug report to Discord'
      };
    }
  }

  private buildDiscordPayload(data: BugReportData, config: any) {
    const embed = {
      title: data.title || 'Bug Report',
      description: data.description,
      color: this.getPriorityColor(data.priority),
      timestamp: new Date(data.timestamp).toISOString(),
      fields: [
        { name: 'URL', value: data.url, inline: true },
        { name: 'User', value: data.userEmail || 'Anonymous', inline: true },
        { name: 'Viewport', value: `${data.viewport.width}×${data.viewport.height}`, inline: true }
      ],
      footer: {
        text: 'Bug Reporter'
      }
    };

    if (data.consoleLogs.length > 0) {
      embed.fields.push({
        name: 'Recent Console Logs',
        value: '```' + data.consoleLogs.slice(-3).map(log => 
          `${log.level.toUpperCase()}: ${log.message.slice(0, 100)}`
        ).join('\n') + '```',
        inline: false
      });
    }

    return {
      username: config.username || 'Bug Reporter',
      avatar_url: config.avatar,
      embeds: [embed]
    };
  }

  private getPriorityColor(priority?: string): number {
    switch (priority) {
      case 'urgent': return 0xff0000;
      case 'high': return 0xff9900;
      case 'medium': return 0xffcc00;
      case 'low': return 0x00cc00;
      default: return 0x808080;
    }
  }

  validateConfig(config: any): boolean {
    // Validate proxy mode
    if (config && config.mode === 'proxy') {
      return this.validateProxyConfig(config);
    }
    
    // Validate direct mode
    return !!(
      config &&
      typeof config.webhook === 'string' &&
      config.webhook.includes('discord.com/api/webhooks')
    );
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        webhook: {
          type: 'string',
          format: 'uri',
          description: 'Discord webhook URL'
        },
        username: {
          type: 'string',
          description: 'Bot username (default: Bug Reporter)'
        },
        avatar: {
          type: 'string',
          format: 'uri',
          description: 'Bot avatar URL'
        }
      },
      required: ['webhook']
    };
  }
}