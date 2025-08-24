export { BaseIntegration } from './base';
export { GitHubIntegration } from './github';
export { LinearIntegration } from './linear';
export { WebhookIntegration, SlackIntegration, DiscordIntegration } from './webhook';
export { EmailIntegration } from './email';

import { GitHubIntegration } from './github';
import { LinearIntegration } from './linear';
import { WebhookIntegration, SlackIntegration, DiscordIntegration } from './webhook';
import { EmailIntegration } from './email';

// Registry of all available integrations
export const integrations = {
  github: new GitHubIntegration(),
  linear: new LinearIntegration(),
  webhook: new WebhookIntegration(),
  slack: new SlackIntegration(),
  discord: new DiscordIntegration(),
  email: new EmailIntegration()
} as const;

export type IntegrationName = keyof typeof integrations;