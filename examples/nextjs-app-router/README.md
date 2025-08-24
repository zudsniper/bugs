# Next.js App Router Example - @zudsniper/bugs

This example demonstrates how to securely integrate @zudsniper/bugs with Next.js App Router using proxy mode to keep API keys secure on the server-side.

## Security First Approach

⚠️ **CRITICAL**: This example uses **proxy mode** to ensure API keys never reach the client-side code. All sensitive credentials are handled by server-side API routes.

## Setup Instructions

### 1. Install Dependencies

```bash
npm install @zudsniper/bugs
# or
yarn add @zudsniper/bugs
# or
pnpm add @zudsniper/bugs
```

### 2. Configure Environment Variables

Copy the example environment file:

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your actual credentials:

```bash
# GitHub Integration
GITHUB_TOKEN=github_pat_your_actual_token
GITHUB_REPO=your-username/your-repo

# Linear Integration
LINEAR_API_KEY=lin_api_your_actual_key
LINEAR_TEAM_ID=your_team_id

# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url

# Generic Webhook (optional)
WEBHOOK_URL=https://your-api.com/bug-reports
WEBHOOK_AUTH_TOKEN=your_bearer_token
```

### 3. Implementation

The example includes:

- **Frontend Component** (`page.tsx`): Shows how to configure the bug reporter with proxy endpoints
- **API Routes** (`app/api/bug-report/*/route.ts`): Secure server-side handlers for each integration
- **Environment Configuration** (`.env.local.example`): Template for required environment variables

### 4. API Routes Included

#### GitHub Issues (`/api/bug-report/github`)
- Creates GitHub issues with formatted bug reports
- Handles authentication server-side
- Includes environment details, console logs, and network failures

#### Linear Issues (`/api/bug-report/linear`)
- Creates Linear issues using GraphQL API
- Properly formats descriptions for Linear's interface
- Supports priority and project assignment

#### Generic Webhook (`/api/bug-report/webhook`)
- Flexible webhook integration for custom APIs
- Supports various authentication methods
- Configurable payload structure

#### Slack Notifications (`/api/bug-report/slack`)
- Sends formatted bug reports to Slack channels
- Rich formatting with attachments and fields
- Priority-based color coding

## Usage

```tsx
import { BugReporter, mergeConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

function App() {
  // Secure configuration - API keys stay on server
  const config = mergeConfigs(
    {
      integrations: {
        github: {
          mode: 'proxy',
          endpoint: '/api/bug-report/github'
        },
        linear: {
          mode: 'proxy', 
          endpoint: '/api/bug-report/linear'
        }
      }
    },
    {
      ui: {
        title: 'Report a Bug',
        theme: 'auto',
        position: 'bottom-right'
      },
      validation: {
        requireTitle: true,
        requireDescription: true
      }
    }
  );

  return (
    <div>
      <h1>My App</h1>
      <BugReporter 
        config={config}
        onSubmitSuccess={(response) => {
          console.log('Bug report submitted:', response.issueId);
        }}
      />
    </div>
  );
}
```

## API Route Structure

Each API route follows this pattern:

1. **Validate Environment**: Check required environment variables
2. **Process Bug Data**: Format the incoming bug report data
3. **Make External API Call**: Use server-side credentials to call external services
4. **Return Response**: Return standardized success/error response

Example response format:

```json
{
  "success": true,
  "issueId": "123",
  "issueUrl": "https://github.com/owner/repo/issues/123",
  "message": "Issue #123 created successfully"
}
```

## Environment Variables Reference

### GitHub Integration
- `GITHUB_TOKEN`: Personal access token or fine-grained token with issues write permission
- `GITHUB_REPO`: Repository in format "owner/repo"

### Linear Integration
- `LINEAR_API_KEY`: Linear API key from your workspace settings
- `LINEAR_TEAM_ID`: Team identifier where issues should be created
- `LINEAR_PROJECT_ID`: (Optional) Project to assign issues to

### Slack Integration
- `SLACK_WEBHOOK_URL`: Incoming webhook URL from your Slack app
- `SLACK_CHANNEL`: (Optional) Override default channel
- `SLACK_BOT_NAME`: (Optional) Custom bot name
- `SLACK_BOT_EMOJI`: (Optional) Custom bot emoji

### Generic Webhook
- `WEBHOOK_URL`: Your custom webhook endpoint
- `WEBHOOK_METHOD`: (Optional) HTTP method, defaults to POST
- `WEBHOOK_AUTH_TOKEN`: (Optional) Bearer token for authentication
- `WEBHOOK_API_KEY`: (Optional) API key for authentication
- `WEBHOOK_CUSTOM_HEADERS`: (Optional) JSON string with custom headers

## Security Features

1. **Server-Side Only**: API keys never exposed to client-side code
2. **Rate Limiting**: Consider adding rate limiting to your API routes
3. **Input Validation**: Validate and sanitize incoming bug report data
4. **Error Handling**: Proper error handling without exposing sensitive information
5. **HTTPS**: All external API calls use HTTPS

## Customization

You can customize the bug report formatting by modifying the format functions in each API route. Each integration has specific requirements:

- **GitHub**: Supports Markdown formatting in issue body
- **Linear**: Uses Markdown with specific field structure
- **Slack**: Uses Slack's rich formatting with attachments
- **Webhook**: Flexible JSON payload structure

## Development vs Production

### Development
```tsx
// For development, you might use direct mode with test tokens
const config = {
  integrations: {
    github: {
      mode: 'direct',
      repo: 'test/repo',
      token: 'test_token'  // ⚠️ Only for development!
    }
  }
};
```

### Production
```tsx
// Always use proxy mode in production
const config = {
  integrations: {
    github: {
      mode: 'proxy',
      endpoint: '/api/bug-report/github'  // ✅ Secure
    }
  }
};
```

## Troubleshooting

### Common Issues

1. **Environment Variables Not Found**
   - Ensure `.env.local` is in the correct location
   - Restart your development server after adding new variables
   - Check variable names match exactly (case-sensitive)

2. **GitHub API Errors**
   - Verify token has `issues` write permission
   - Check repository exists and is accessible
   - Ensure token hasn't expired

3. **Linear API Errors**
   - Confirm team ID is correct
   - Verify API key is valid and has issue creation permission
   - Check team settings allow issue creation

4. **Webhook Failures**
   - Test webhook URL manually with curl/Postman
   - Check authentication headers are correctly formatted
   - Verify receiving endpoint can handle the payload structure

### Debug Mode

Enable debug logging by adding to your API routes:

```typescript
console.log('Bug report data:', JSON.stringify(bugData, null, 2));
```

## Next Steps

1. Add rate limiting using `next-rate-limit` or similar
2. Implement request validation with Zod or similar
3. Add monitoring and alerting for failed submissions
4. Consider caching for better performance
5. Add unit tests for your API routes

## Related Examples

- [Pages Router Example](../nextjs-pages-router/) - For Next.js Pages Router
- [React Example](../react/) - For Create React App or similar
- [Vite Example](../vite/) - For Vite-based applications