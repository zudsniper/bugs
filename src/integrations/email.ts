import { BaseIntegration } from './base';
import { BugReportData, SubmissionResponse } from '../types';

interface EmailConfig {
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
  // For client-side email integration (using services like EmailJS)
  emailJsConfig?: {
    serviceId: string;
    templateId: string;
    publicKey: string;
  };
}

export class EmailIntegration extends BaseIntegration {
  name = 'email';

  async submit(data: BugReportData, config: EmailConfig): Promise<SubmissionResponse> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'Invalid email configuration'
      };
    }

    try {
      // If EmailJS configuration is provided, use client-side email
      if (config.emailJsConfig) {
        return await this.sendWithEmailJS(data, config);
      }
      
      // Otherwise, assume server-side SMTP handling
      return await this.sendWithServerSide(data, config);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to send email'
      };
    }
  }

  private async sendWithEmailJS(data: BugReportData, config: EmailConfig): Promise<SubmissionResponse> {
    // Check if EmailJS is available
    if (typeof window === 'undefined' || !(window as any).emailjs) {
      throw new Error('EmailJS library not found. Please include EmailJS in your project.');
    }

    const emailjs = (window as any).emailjs;

    try {
      const emailData = {
        to_email: config.to,
        from_email: config.from || data.userEmail || 'noreply@example.com',
        subject: config.subject || data.title || 'Bug Report',
        title: data.title || 'Bug Report',
        description: data.description || '',
        url: data.url,
        user_agent: data.userAgent,
        viewport: `${data.viewport.width}x${data.viewport.height}`,
        timestamp: new Date(data.timestamp).toISOString(),
        user_email: data.userEmail || 'Not provided',
        user_id: data.userId || 'Not provided',
        console_logs: this.formatConsoleLogsForEmail(data.consoleLogs),
        network_requests: this.formatNetworkRequestsForEmail(data.networkRequests),
        markdown_content: this.formatMarkdown(data),
        screenshot: data.screenshot ? 'Screenshot attached' : 'No screenshot'
      };

      const result = await emailjs.send(
        config.emailJsConfig!.serviceId,
        config.emailJsConfig!.templateId,
        emailData,
        config.emailJsConfig!.publicKey
      );

      return {
        success: true,
        message: 'Email sent successfully',
        issueId: result.text
      };
    } catch (error) {
      throw new Error(`EmailJS error: ${error}`);
    }
  }

  private async sendWithServerSide(data: BugReportData, config: EmailConfig): Promise<SubmissionResponse> {
    const emailPayload = {
      to: config.to,
      from: config.from,
      subject: config.subject || data.title || 'Bug Report',
      html: this.buildEmailHTML(data),
      text: this.buildEmailText(data),
      attachments: data.screenshot ? [{
        filename: `screenshot-${Date.now()}.png`,
        content: data.screenshot.split(',')[1], // Remove data:image/png;base64, prefix
        encoding: 'base64',
        contentType: 'image/png'
      }] : [],
      smtpConfig: config.smtpConfig
    };

    // This would typically be sent to your server endpoint
    // For this example, we'll assume there's an endpoint at /api/send-email
    const response = await this.makeRequest('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailPayload),
    });

    const result = await response.json();

    return {
      success: true,
      message: 'Email sent successfully',
      issueId: result.messageId
    };
  }

  private buildEmailHTML(data: BugReportData): string {
    const sections: string[] = [];

    sections.push(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .header { background: #f97316; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
            .content { padding: 20px; background: #f9f9f9; }
            .section { margin-bottom: 20px; }
            .section h3 { color: #f97316; border-bottom: 2px solid #f97316; padding-bottom: 5px; }
            .meta { background: white; padding: 15px; border-radius: 8px; border-left: 4px solid #f97316; }
            .console-logs { background: #1a1a1a; color: #fff; padding: 15px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 12px; }
            .network-table { width: 100%; border-collapse: collapse; }
            .network-table th, .network-table td { padding: 8px; border: 1px solid #ddd; text-align: left; }
            .network-table th { background-color: #f2f2f2; }
            .footer { background: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🐛 Bug Report</h1>
            <p>${data.title || 'Issue Report'}</p>
          </div>
          <div class="content">
    `);

    if (data.description) {
      sections.push(`
        <div class="section">
          <h3>Description</h3>
          <p>${this.htmlEscape(data.description)}</p>
        </div>
      `);
    }

    sections.push(`
      <div class="section">
        <h3>Environment Information</h3>
        <div class="meta">
          <p><strong>URL:</strong> ${data.url}</p>
          <p><strong>User Agent:</strong> ${data.userAgent}</p>
          <p><strong>Viewport:</strong> ${data.viewport.width} × ${data.viewport.height}</p>
          <p><strong>Timestamp:</strong> ${new Date(data.timestamp).toLocaleString()}</p>
          ${data.userEmail ? `<p><strong>User Email:</strong> ${data.userEmail}</p>` : ''}
          ${data.userId ? `<p><strong>User ID:</strong> ${data.userId}</p>` : ''}
        </div>
      </div>
    `);

    if (data.consoleLogs.length > 0) {
      sections.push(`
        <div class="section">
          <h3>Console Logs</h3>
          <div class="console-logs">
      `);
      
      data.consoleLogs.slice(-10).forEach(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        const level = log.level.toUpperCase();
        sections.push(`[${time}] ${level}: ${this.htmlEscape(log.message)}<br>`);
      });
      
      sections.push(`
          </div>
        </div>
      `);
    }

    if (data.networkRequests.length > 0) {
      sections.push(`
        <div class="section">
          <h3>Network Requests</h3>
          <table class="network-table">
            <thead>
              <tr>
                <th>Method</th>
                <th>URL</th>
                <th>Status</th>
                <th>Duration</th>
              </tr>
            </thead>
            <tbody>
      `);
      
      data.networkRequests.slice(-10).forEach(req => {
        sections.push(`
          <tr>
            <td>${req.method}</td>
            <td>${this.htmlEscape(req.url)}</td>
            <td>${req.status || 'N/A'}</td>
            <td>${req.duration || 'N/A'}ms</td>
          </tr>
        `);
      });
      
      sections.push(`
            </tbody>
          </table>
        </div>
      `);
    }

    sections.push(`
          </div>
          <div class="footer">
            <p>This report was automatically generated by Bug Reporter</p>
            <p>Report ID: ${data.timestamp}</p>
          </div>
        </body>
      </html>
    `);

    return sections.join('');
  }

  private buildEmailText(data: BugReportData): string {
    const sections: string[] = [];

    sections.push('BUG REPORT');
    sections.push('==========');
    sections.push('');

    if (data.title) {
      sections.push(`Title: ${data.title}`);
      sections.push('');
    }

    if (data.description) {
      sections.push('Description:');
      sections.push(data.description);
      sections.push('');
    }

    sections.push('Environment Information:');
    sections.push(`- URL: ${data.url}`);
    sections.push(`- User Agent: ${data.userAgent}`);
    sections.push(`- Viewport: ${data.viewport.width} × ${data.viewport.height}`);
    sections.push(`- Timestamp: ${new Date(data.timestamp).toISOString()}`);
    
    if (data.userEmail) {
      sections.push(`- User Email: ${data.userEmail}`);
    }
    
    if (data.userId) {
      sections.push(`- User ID: ${data.userId}`);
    }
    
    sections.push('');

    if (data.consoleLogs.length > 0) {
      sections.push('Console Logs:');
      data.consoleLogs.slice(-10).forEach(log => {
        const time = new Date(log.timestamp).toISOString();
        sections.push(`[${time}] ${log.level.toUpperCase()}: ${log.message}`);
      });
      sections.push('');
    }

    if (data.networkRequests.length > 0) {
      sections.push('Network Requests:');
      data.networkRequests.slice(-10).forEach(req => {
        sections.push(`${req.method} ${req.url} - Status: ${req.status || 'N/A'} (${req.duration || 'N/A'}ms)`);
      });
      sections.push('');
    }

    sections.push('---');
    sections.push(`This report was automatically generated by Bug Reporter (ID: ${data.timestamp})`);

    return sections.join('\n');
  }

  private formatConsoleLogsForEmail(logs: any[]): string {
    if (logs.length === 0) return 'No console logs captured';
    
    return logs.slice(-10).map(log => {
      const time = new Date(log.timestamp).toLocaleTimeString();
      return `[${time}] ${log.level.toUpperCase()}: ${log.message}`;
    }).join('\n');
  }

  private formatNetworkRequestsForEmail(requests: any[]): string {
    if (requests.length === 0) return 'No network requests captured';
    
    return requests.slice(-10).map(req => 
      `${req.method} ${req.url} - ${req.status || 'N/A'} (${req.duration || 'N/A'}ms)`
    ).join('\n');
  }

  private htmlEscape(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  validateConfig(config: any): boolean {
    return !!(
      config &&
      typeof config.to === 'string' &&
      config.to.includes('@') &&
      (config.smtpConfig || config.emailJsConfig)
    );
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        to: {
          type: 'string',
          format: 'email',
          description: 'Recipient email address'
        },
        from: {
          type: 'string',
          format: 'email',
          description: 'Sender email address (optional)'
        },
        subject: {
          type: 'string',
          description: 'Email subject (default: bug report title)'
        },
        smtpConfig: {
          type: 'object',
          properties: {
            host: { type: 'string', description: 'SMTP server host' },
            port: { type: 'number', description: 'SMTP server port' },
            secure: { type: 'boolean', description: 'Use SSL/TLS' },
            auth: {
              type: 'object',
              properties: {
                user: { type: 'string', description: 'SMTP username' },
                pass: { type: 'string', description: 'SMTP password' }
              },
              required: ['user', 'pass']
            }
          },
          required: ['host', 'port', 'auth']
        },
        emailJsConfig: {
          type: 'object',
          properties: {
            serviceId: { type: 'string', description: 'EmailJS service ID' },
            templateId: { type: 'string', description: 'EmailJS template ID' },
            publicKey: { type: 'string', description: 'EmailJS public key' }
          },
          required: ['serviceId', 'templateId', 'publicKey']
        }
      },
      required: ['to'],
      anyOf: [
        { required: ['smtpConfig'] },
        { required: ['emailJsConfig'] }
      ]
    };
  }
}