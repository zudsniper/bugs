import { BaseIntegration } from './base';
import { BugReportData, SubmissionResponse } from '../types';

interface LinearConfig {
  apiKey: string;
  teamId: string;
  projectId?: string;
  labels?: string[];
  assigneeId?: string;
  priority?: number; // 0=No Priority, 1=Urgent, 2=High, 3=Medium, 4=Low
  estimate?: number;
}

export class LinearIntegration extends BaseIntegration {
  name = 'linear';
  private readonly apiUrl = 'https://api.linear.app/graphql';

  async submit(data: BugReportData, config: LinearConfig): Promise<SubmissionResponse> {
    if (!this.validateConfig(config)) {
      return {
        success: false,
        error: 'Invalid Linear configuration'
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
      if (data.screenshot && issue.id) {
        await this.uploadScreenshotAsAttachment(data.screenshot, config, issue.id);
      }

      return {
        success: true,
        issueId: issue.identifier || issue.id,
        issueUrl: issue.url,
        message: `Issue created successfully: ${issue.identifier}`
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create Linear issue'
      };
    }
  }

  private async createIssue(data: BugReportData, config: LinearConfig) {
    const title = data.title || 'Bug Report';
    const description = this.formatLinearDescription(data);
    
    const mutation = `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue {
            id
            identifier
            title
            url
          }
        }
      }
    `;

    const variables = {
      input: {
        title,
        description,
        teamId: config.teamId,
        priority: config.priority || 3, // Default to Medium
        ...(config.projectId && { projectId: config.projectId }),
        ...(config.assigneeId && { assigneeId: config.assigneeId }),
        ...(config.estimate && { estimate: config.estimate }),
        ...(config.labels && config.labels.length > 0 && {
          labelIds: await this.resolveLabelIds(config.labels, config)
        })
      }
    };

    const response = await this.makeRequest(this.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': config.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query: mutation, variables }),
    });

    const result = await response.json();
    
    if (result.errors) {
      throw new Error(`Linear API error: ${result.errors.map((e: any) => e.message).join(', ')}`);
    }

    if (!result.data?.issueCreate?.success) {
      throw new Error('Failed to create Linear issue');
    }

    return result.data.issueCreate.issue;
  }

  private formatLinearDescription(data: BugReportData): string {
    const sections: string[] = [];

    if (data.description) {
      sections.push(data.description);
      sections.push('');
    }

    // Environment info
    sections.push('## Environment');
    sections.push(`**URL:** ${data.url}`);
    sections.push(`**User Agent:** ${data.userAgent}`);
    sections.push(`**Viewport:** ${data.viewport.width}x${data.viewport.height}`);
    sections.push(`**Timestamp:** ${new Date(data.timestamp).toISOString()}`);

    if (data.userEmail) {
      sections.push(`**Email:** ${data.userEmail}`);
    }

    // Reproduction steps
    if (data.reproductionSteps && data.reproductionSteps.length > 0) {
      sections.push('', '## Steps to Reproduce');
      data.reproductionSteps.forEach((step, index) => {
        sections.push(`${index + 1}. ${step}`);
      });
    }

    // Expected vs Actual behavior
    if (data.expectedBehavior) {
      sections.push('', '## Expected Behavior');
      sections.push(data.expectedBehavior);
    }

    if (data.actualBehavior) {
      sections.push('', '## Actual Behavior');
      sections.push(data.actualBehavior);
    }

    // Console logs (limited for readability)
    if (data.consoleLogs.length > 0) {
      sections.push('', '## Console Logs');
      sections.push('```');
      data.consoleLogs.slice(-5).forEach(log => {
        const time = new Date(log.timestamp).toLocaleTimeString();
        sections.push(`[${time}] ${log.level.toUpperCase()}: ${log.message}`);
      });
      if (data.consoleLogs.length > 5) {
        sections.push(`... and ${data.consoleLogs.length - 5} more log entries`);
      }
      sections.push('```');
    }

    // Network requests (most recent failures/errors)
    const errorRequests = data.networkRequests.filter(req => req.status === 0 || (req.status && req.status >= 400));
    if (errorRequests.length > 0) {
      sections.push('', '## Failed Network Requests');
      errorRequests.slice(-3).forEach(req => {
        sections.push(`- **${req.method} ${req.url}** - Status: ${req.status || 'Failed'} (${req.duration || 'N/A'}ms)`);
      });
    }

    sections.push('', '---');
    sections.push('*Automatically generated by Bug Reporter*');

    return sections.join('\n');
  }

  private async resolveLabelIds(labelNames: string[], config: LinearConfig): Promise<string[]> {
    try {
      const query = `
        query Team($id: String!) {
          team(id: $id) {
            labels {
              nodes {
                id
                name
              }
            }
          }
        }
      `;

      const response = await this.makeRequest(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          variables: { id: config.teamId }
        }),
      });

      const result = await response.json();
      
      if (result.errors || !result.data?.team?.labels?.nodes) {
        console.warn('Could not resolve label IDs, skipping labels');
        return [];
      }

      const availableLabels = result.data.team.labels.nodes;
      const labelIds: string[] = [];

      labelNames.forEach(labelName => {
        const label = availableLabels.find((l: any) => 
          l.name.toLowerCase() === labelName.toLowerCase()
        );
        if (label) {
          labelIds.push(label.id);
        }
      });

      return labelIds;
    } catch (error) {
      console.warn('Failed to resolve label IDs:', error);
      return [];
    }
  }

  private async uploadScreenshotAsAttachment(screenshot: string, config: LinearConfig, issueId: string) {
    try {
      // Linear doesn't have a direct attachment API for screenshots in GraphQL
      // We'll add it as a comment with the image data
      const mutation = `
        mutation CommentCreate($input: CommentCreateInput!) {
          commentCreate(input: $input) {
            success
            comment {
              id
            }
          }
        }
      `;

      const screenshotDataUri = screenshot.startsWith('data:') ? screenshot : `data:image/png;base64,${screenshot}`;

      const variables = {
        input: {
          issueId,
          body: `## Screenshot\n\n![Screenshot](${screenshotDataUri})\n\n*Screenshot captured automatically when bug was reported*`
        }
      };

      await this.makeRequest(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': config.apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: mutation, variables }),
      });
    } catch (error) {
      console.error('Failed to upload screenshot to Linear:', error);
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
      typeof config.apiKey === 'string' &&
      config.apiKey.trim().length > 0 &&
      typeof config.teamId === 'string' &&
      config.teamId.trim().length > 0
    );
  }

  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'Linear API key'
        },
        teamId: {
          type: 'string',
          description: 'Linear team ID'
        },
        projectId: {
          type: 'string',
          description: 'Linear project ID (optional)'
        },
        labels: {
          type: 'array',
          items: { type: 'string' },
          description: 'Label names to add to the issue'
        },
        assigneeId: {
          type: 'string',
          description: 'Linear user ID to assign the issue to'
        },
        priority: {
          type: 'number',
          minimum: 0,
          maximum: 4,
          description: 'Issue priority (0=No Priority, 1=Urgent, 2=High, 3=Medium, 4=Low)'
        },
        estimate: {
          type: 'number',
          minimum: 1,
          maximum: 21,
          description: 'Story point estimate'
        }
      },
      required: ['apiKey', 'teamId']
    };
  }
}