import { BugReportData, SubmissionResponse, IntegrationAdapter } from '../types';

export abstract class BaseIntegration implements IntegrationAdapter {
  abstract name: string;
  
  abstract submit(data: BugReportData, config: any): Promise<SubmissionResponse>;
  
  abstract validateConfig(config: any): boolean;
  
  abstract getConfigSchema?(): object;

  protected async submitViaProxy(data: BugReportData, endpoint: string): Promise<SubmissionResponse> {
    try {
      const response = await this.makeRequest(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();
      
      if (!result.success) {
        return {
          success: false,
          error: result.error || 'Proxy endpoint returned error'
        };
      }

      return {
        success: true,
        issueId: result.issueId,
        issueUrl: result.issueUrl,
        message: result.message || 'Report submitted successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to submit via proxy'
      };
    }
  }

  protected isProxyMode(config: any): config is { mode: 'proxy'; endpoint: string } {
    return config && config.mode === 'proxy' && typeof config.endpoint === 'string';
  }

  protected validateProxyConfig(config: any): boolean {
    return !!(
      config &&
      config.mode === 'proxy' &&
      typeof config.endpoint === 'string' &&
      config.endpoint.trim().length > 0
    );
  }

  protected formatMarkdown(data: BugReportData): string {
    const sections: string[] = [];

    // Basic info
    sections.push(`**URL:** ${data.url}`);
    sections.push(`**User Agent:** ${data.userAgent}`);
    sections.push(`**Viewport:** ${data.viewport.width}x${data.viewport.height}`);
    sections.push(`**Timestamp:** ${new Date(data.timestamp).toISOString()}`);

    if (data.userEmail) {
      sections.push(`**Email:** ${data.userEmail}`);
    }

    if (data.userId) {
      sections.push(`**User ID:** ${data.userId}`);
    }

    // Description
    if (data.description) {
      sections.push('', '## Description', data.description);
    }

    // Reproduction steps
    if (data.reproductionSteps && data.reproductionSteps.length > 0) {
      sections.push('', '## Reproduction Steps');
      data.reproductionSteps.forEach((step, index) => {
        sections.push(`${index + 1}. ${step}`);
      });
    }

    // Expected vs Actual behavior
    if (data.expectedBehavior) {
      sections.push('', '## Expected Behavior', data.expectedBehavior);
    }

    if (data.actualBehavior) {
      sections.push('', '## Actual Behavior', data.actualBehavior);
    }

    // Console logs
    if (data.consoleLogs.length > 0) {
      sections.push('', '## Console Logs');
      sections.push('```');
      data.consoleLogs.slice(-10).forEach(log => {
        const time = new Date(log.timestamp).toISOString();
        sections.push(`[${time}] ${log.level.toUpperCase()}: ${log.message}`);
      });
      sections.push('```');
    }

    // Network requests
    if (data.networkRequests.length > 0) {
      sections.push('', '## Recent Network Requests');
      sections.push('| Method | URL | Status | Duration |');
      sections.push('|--------|-----|--------|----------|');
      data.networkRequests.slice(-10).forEach(req => {
        sections.push(`| ${req.method} | ${req.url} | ${req.status || 'N/A'} | ${req.duration || 'N/A'}ms |`);
      });
    }

    // Additional files
    if (data.additionalFiles && data.additionalFiles.length > 0) {
      sections.push('', '## Attached Files');
      data.additionalFiles.forEach(file => {
        sections.push(`- [${file.name}](${file.url}) (${(file.size / 1024).toFixed(1)}KB)`);
      });
    }

    return sections.join('\n');
  }

  protected async uploadScreenshot(
    screenshot: string,
    uploadFunction: (file: Blob, filename: string) => Promise<string>
  ): Promise<string | undefined> {
    if (!screenshot) return undefined;

    try {
      // Convert data URL to blob
      const response = await fetch(screenshot);
      const blob = await response.blob();
      
      const filename = `screenshot-${Date.now()}.png`;
      return await uploadFunction(blob, filename);
    } catch (error) {
      console.error('Failed to upload screenshot:', error);
      return undefined;
    }
  }

  protected sanitizeForMarkdown(text: string): string {
    return text
      .replace(/[\\]/g, '\\\\')
      .replace(/[*]/g, '\\*')
      .replace(/[_]/g, '\\_')
      .replace(/[#]/g, '\\#')
      .replace(/[\[\]]/g, '\\$&');
  }

  protected truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  protected async makeRequest(
    url: string,
    options: RequestInit,
    retries: number = 3
  ): Promise<Response> {
    let lastError: Error | undefined;
    
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          ...options,
          headers: {
            'Content-Type': 'application/json',
            ...options.headers,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        if (i < retries - 1) {
          // Wait before retry with exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  }
}