import { BaseIntegration } from './base';
import { BugReportData, SubmissionResponse } from '../types';

interface GitHubConfig {
  repo: string; // owner/repo
  token: string;
  labels?: string[];
  assignees?: string[];
  projects?: string[];
  milestone?: string;
  issueTemplate?: string;
}

export class GitHubIntegration extends BaseIntegration {
  name = 'github';

  async submit(data: BugReportData, config: GitHubConfig): Promise<SubmissionResponse> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'Invalid GitHub configuration'
      };
    }

    // Handle proxy mode
    if (this.isProxyMode(config)) {
      return this.submitViaProxy(data, config.endpoint);
    }

    // Handle direct mode (traditional implementation)
    try {
      const issue = await this.createIssue(data, config);
      
      // Upload screenshot as attachment if present
      if (data.screenshot && issue.number) {
        await this.uploadScreenshotAsAttachment(data.screenshot, config, issue.number);
      }

      return {
        success: true,
        issueId: issue.number?.toString(),
        issueUrl: issue.html_url,
        message: `Issue created successfully: #${issue.number}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create GitHub issue'
      };
    }
  }

  private async createIssue(data: BugReportData, config: GitHubConfig) {
    const title = data.title || 'Bug Report';
    const body = this.buildIssueBody(data, config);
    
    const issueData: any = {
      title,
      body,
      labels: [...(config.labels || []), 'bug', 'bug-reporter'].filter(Boolean),
    };

    if (config.assignees && config.assignees.length > 0) {
      issueData.assignees = config.assignees;
    }

    if (config.milestone) {
      issueData.milestone = config.milestone;
    }

    const response = await this.makeRequest(
      `https://api.github.com/repos/${config.repo}/issues`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Accept': 'application/vnd.github.v3+json',
        },
        body: JSON.stringify(issueData),
      }
    );

    return await response.json();
  }

  private buildIssueBody(data: BugReportData, config: GitHubConfig): string {
    let body = '';

    // Use custom template if provided
    if (config.issueTemplate) {
      body = this.replaceTemplatePlaceholders(config.issueTemplate, data);
    } else {
      body = this.formatMarkdown(data);
    }

    // Add metadata section
    body += '\n\n---\n';
    body += '*This issue was automatically created by Bug Reporter*\n';
    if (data.timestamp) {
      body += `*Report ID: ${data.timestamp}*`;
    }

    return body;
  }

  private replaceTemplatePlaceholders(template: string, data: BugReportData): string {
    return template
      .replace(/\{\{title\}\}/g, data.title || '')
      .replace(/\{\{description\}\}/g, data.description || '')
      .replace(/\{\{url\}\}/g, data.url || '')
      .replace(/\{\{userAgent\}\}/g, data.userAgent || '')
      .replace(/\{\{timestamp\}\}/g, new Date(data.timestamp).toISOString())
      .replace(/\{\{email\}\}/g, data.userEmail || 'Not provided')
      .replace(/\{\{userId\}\}/g, data.userId || 'Not provided')
      .replace(/\{\{viewport\}\}/g, `${data.viewport.width}x${data.viewport.height}`)
      .replace(/\{\{consoleLogs\}\}/g, this.formatConsoleLogsForTemplate(data.consoleLogs))
      .replace(/\{\{networkRequests\}\}/g, this.formatNetworkRequestsForTemplate(data.networkRequests))
      .replace(/\{\{reproductionSteps\}\}/g, this.formatReproductionSteps(data.reproductionSteps))
      .replace(/\{\{expectedBehavior\}\}/g, data.expectedBehavior || '')
      .replace(/\{\{actualBehavior\}\}/g, data.actualBehavior || '');
  }

  private formatConsoleLogsForTemplate(logs: any[]): string {
    if (logs.length === 0) return 'No console logs captured';
    
    return '```\n' + 
      logs.slice(-10).map(log => 
        `[${new Date(log.timestamp).toISOString()}] ${log.level.toUpperCase()}: ${log.message}`
      ).join('\n') + 
      '\n```';
  }

  private formatNetworkRequestsForTemplate(requests: any[]): string {
    if (requests.length === 0) return 'No network requests captured';
    
    let result = '| Method | URL | Status | Duration |\n';
    result += '|--------|-----|--------|----------|\n';
    
    requests.slice(-10).forEach(req => {
      result += `| ${req.method} | ${req.url} | ${req.status || 'N/A'} | ${req.duration || 'N/A'}ms |\n`;
    });
    
    return result;
  }

  private formatReproductionSteps(steps?: string[]): string {
    if (!steps || steps.length === 0) return 'Not provided';
    
    return steps.map((step, index) => `${index + 1}. ${step}`).join('\n');
  }

  private async uploadScreenshotAsAttachment(screenshot: string, config: GitHubConfig, issueNumber: number) {
    try {
      const screenshotUrl = await this.uploadScreenshot(screenshot, async (blob, filename) => {
        // Create a release asset or use GitHub's attachment API if available
        // For now, we'll add it as a comment with the image
        const base64 = await this.blobToBase64(blob);
        
        await this.makeRequest(
          `https://api.github.com/repos/${config.repo}/issues/${issueNumber}/comments`,
          {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${config.token}`,
              'Accept': 'application/vnd.github.v3+json',
            },
            body: JSON.stringify({
              body: `## Screenshot\n\n![Screenshot](data:image/png;base64,${base64})`
            }),
          }
        );
        
        return `data:image/png;base64,${base64}`;
      });
      
      return screenshotUrl;
    } catch (error) {
      console.error('Failed to upload screenshot to GitHub:', error);
    }
  }

  private async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]); // Remove data:image/png;base64, prefix
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  validateConfig(config: any): boolean {
    // Validate proxy mode
    if (config && config.mode === 'proxy') {
      return this.validateProxyConfig(config);
    }
    
    // Validate direct mode
    return !!(
      config &&
      typeof config.repo === 'string' &&
      config.repo.includes('/') &&
      typeof config.token === 'string' &&
      config.token.trim().length > 0
    );
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        repo: {
          type: 'string',
          description: 'GitHub repository in owner/repo format',
          pattern: '^[^/]+/[^/]+$'
        },
        token: {
          type: 'string',
          description: 'GitHub personal access token or fine-grained token'
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Labels to add to the issue'
        },
        assignees: {
          type: 'array',
          items: { type: 'string' },
          description: 'GitHub usernames to assign to the issue'
        },
        projects: {
          type: 'array',
          items: { type: 'string' },
          description: 'Project IDs to add the issue to'
        },
        milestone: {
          type: 'string',
          description: 'Milestone title or number'
        },
        issueTemplate: {
          type: 'string',
          description: 'Custom issue template with placeholders'
        }
      },
      required: ['repo', 'token']
    };
  }
}