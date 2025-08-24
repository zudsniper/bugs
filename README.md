# 🐛 @zudsniper/bugs

A comprehensive, standalone bug reporter widget for React and Next.js applications with screenshot capture, console logging, and multiple integration options.

![Bug Reporter Demo](https://via.placeholder.com/800x400/f97316/white?text=Bug+Reporter+Demo)

## ✨ Features

- **📸 Screenshot Capture** - Automatic screenshot with privacy controls
- **📝 Console Log Capture** - Automatic console log collection with filtering
- **🌐 Network Request Monitoring** - Track API calls and network issues
- **🔗 Multiple Integrations** - GitHub Issues, Linear, Jira, Slack, Discord, webhooks, and email
- **🎨 Customizable UI** - Themes, positioning, and custom styling
- **📱 Responsive Design** - Mobile-friendly interface
- **🔐 Privacy First** - Configurable data redaction and exclusions
- **⌨️ Keyboard Shortcuts** - Customizable hotkeys
- **📁 File Upload Support** - Drag & drop, paste, and click to upload
- **🔄 TypeScript Support** - Full type safety and IntelliSense

## 🚀 Quick Start

### Installation

```bash
# npm
npm install @zudsniper/bugs

# yarn
yarn add @zudsniper/bugs

# pnpm
pnpm add @zudsniper/bugs
```

### Basic Usage

> ⚠️ **SECURITY WARNING**: The example below shows API keys/tokens directly in code for demonstration purposes only. **Never expose sensitive credentials in frontend code**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
import { BugReporter, defaultConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

function App() {
  const config = defaultConfigs.github('owner/repo', 'github-token');

  return (
    <div>
      <h1>My App</h1>
      <BugReporter config={config} />
    </div>
  );
}
```

That's it! Your users can now report bugs by clicking the floating bug icon.

## 📖 Documentation

### Configuration

The bug reporter is highly configurable through the `BugReporterConfig` object:

> ⚠️ **SECURITY WARNING**: The example below shows API keys/tokens directly in code for demonstration purposes only. **Never expose sensitive credentials in frontend code**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
import { BugReporter, mergeConfigs, defaultConfigs } from '@zudsniper/bugs';

const config = mergeConfigs(
  defaultConfigs.github('owner/repo', 'token'),
  {
    ui: {
      title: 'Report a Bug',
      theme: 'auto',
      position: 'bottom-right',
      primaryColor: '#3b82f6'
    },
    capture: {
      captureScreenshot: true,
      maxConsoleLogs: 50,
      maxNetworkRequests: 25
    },
    validation: {
      requireTitle: true,
      requireDescription: true,
      requireEmail: false
    }
  }
);

<BugReporter config={config} />
```

### Integrations

#### GitHub Issues

> ⚠️ **SECURITY WARNING**: The examples below show API keys/tokens directly in code for demonstration purposes only. **Never expose sensitive credentials in frontend code**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
const config = defaultConfigs.github('owner/repository', 'github-token');

// Or with custom configuration
const config = {
  integrations: {
    github: {
      repo: 'owner/repository',
      token: 'github-token',
      labels: ['bug', 'user-report'],
      assignees: ['developer-username'],
      milestone: 'v1.0'
    }
  }
};
```

#### Linear

> ⚠️ **SECURITY WARNING**: The examples below show API keys/tokens directly in code for demonstration purposes only. **Never expose sensitive credentials in frontend code**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
const config = defaultConfigs.linear('linear-api-key', 'team-id');

// Or with custom configuration
const config = {
  integrations: {
    linear: {
      apiKey: 'linear-api-key',
      teamId: 'team-id',
      projectId: 'project-id',
      priority: 2, // High priority
      labels: ['bug', 'user-feedback']
    }
  }
};
```

#### Slack

```tsx
const config = defaultConfigs.slack('https://hooks.slack.com/your/webhook');

// Or with custom configuration
const config = {
  integrations: {
    slack: {
      webhook: 'https://hooks.slack.com/your/webhook',
      channel: '#bugs',
      username: 'Bug Reporter',
      iconEmoji: ':bug:'
    }
  }
};
```

#### Custom Webhook

> ⚠️ **SECURITY WARNING**: The examples below show API keys/tokens directly in code for demonstration purposes only. **Never expose sensitive credentials in frontend code**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
const config = defaultConfigs.webhook('https://your-api.com/bug-reports');

// Or with authentication
const config = {
  integrations: {
    webhook: {
      url: 'https://your-api.com/bug-reports',
      method: 'POST',
      headers: {
        'Authorization': 'Bearer your-token',
        'X-App-Version': '1.0.0'
      },
      auth: {
        type: 'bearer',
        token: 'your-auth-token'
      }
    }
  }
};
```

### Custom Trigger

Replace the default floating button with your own trigger:

```tsx
function CustomTrigger({ onClick }) {
  return (
    <button onClick={onClick} className="my-bug-button">
      🐛 Report Issue
    </button>
  );
}

<BugReporter config={config}>
  <CustomTrigger />
</BugReporter>
```

### Privacy Controls

Protect sensitive information:

```tsx
const config = {
  privacy: {
    excludeSelectors: [
      '[data-private]',
      '.password-field',
      '.credit-card-input'
    ],
    redactPatterns: [
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // emails
      /\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b/g // credit cards
    ],
    anonymizeUrls: true,
    allowScreenshots: true,
    allowConsoleLogs: false // Disable console logs for privacy
  }
};
```

### Keyboard Shortcuts

```tsx
const config = {
  keyboard: {
    openShortcut: ['ctrl', 'shift', 'b'],
    closeShortcut: ['escape'],
    submitShortcut: ['ctrl', 'enter']
  }
};
```

### Custom Fields

Add custom form fields:

```tsx
const config = {
  ui: {
    fields: [
      {
        type: 'text',
        key: 'title',
        label: 'Issue Title',
        required: true
      },
      {
        type: 'select',
        key: 'severity',
        label: 'Severity',
        options: [
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
          { value: 'critical', label: 'Critical' }
        ],
        required: true
      },
      {
        type: 'textarea',
        key: 'description',
        label: 'Description',
        placeholder: 'Describe the issue...',
        required: true
      },
      {
        type: 'email',
        key: 'userEmail',
        label: 'Email (optional)',
        validation: {
          pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        }
      }
    ]
  }
};
```

## 🎨 Styling and Theming

### Built-in Themes

```tsx
const config = {
  ui: {
    theme: 'light', // 'light', 'dark', or 'auto'
    primaryColor: '#3b82f6'
  }
};
```

### Custom CSS

Override default styles using CSS variables:

```css
:root {
  --br-color-primary: #your-primary-color;
  --br-color-secondary: #your-secondary-color;
  --br-border-radius: 8px;
}

/* Custom styling */
.br-popup-container {
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.br-floating-button {
  background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
}
```

### Custom Styles Object

```tsx
const config = {
  ui: {
    customStyles: {
      '--br-color-primary': '#9333ea',
      '--br-color-secondary': '#7c3aed',
      '--br-border-radius': '12px'
    }
  }
};
```

## 📱 Framework Examples

### Next.js App Router

> ⚠️ **SECURITY WARNING**: The example below uses `NEXT_PUBLIC_*` environment variables which expose values to the client-side code. **This is insecure for production**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
'use client';

import { BugReporter, defaultConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

export default function Layout({ children }) {
  const config = defaultConfigs.github('owner/repo', process.env.NEXT_PUBLIC_GITHUB_TOKEN);
  
  return (
    <html>
      <body>
        {children}
        <BugReporter config={config} />
      </body>
    </html>
  );
}
```

### Next.js Pages Router

> ⚠️ **SECURITY WARNING**: The example below uses `NEXT_PUBLIC_*` environment variables which expose values to the client-side code. **This is insecure for production**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
// pages/_app.tsx
import { BugReporter, defaultConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

export default function MyApp({ Component, pageProps }) {
  const config = defaultConfigs.linear(
    process.env.NEXT_PUBLIC_LINEAR_API_KEY,
    process.env.NEXT_PUBLIC_LINEAR_TEAM_ID
  );

  return (
    <>
      <Component {...pageProps} />
      <BugReporter config={config} />
    </>
  );
}
```

### Vite + React

```tsx
// main.tsx
import { BugReporter, defaultConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

const config = defaultConfigs.webhook('https://your-api.com/bug-reports');

ReactDOM.render(
  <React.StrictMode>
    <App />
    <BugReporter config={config} />
  </React.StrictMode>,
  document.getElementById('root')
);
```

### Vanilla JavaScript (CDN)

```html
<!DOCTYPE html>
<html>
<head>
  <link rel="stylesheet" href="https://unpkg.com/@zudsniper/bugs@latest/dist/styles.css">
</head>
<body>
  <div id="app">Your app content</div>
  
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@zudsniper/bugs@latest/dist/index.js"></script>
  
  <script>
    const { BugReporter, defaultConfigs } = window.ZudsniperBugs;
    const config = defaultConfigs.slack('https://hooks.slack.com/your/webhook');
    
    const container = document.createElement('div');
    document.body.appendChild(container);
    
    ReactDOM.render(
      React.createElement(BugReporter, { config }),
      container
    );
  </script>
</body>
</html>
```

## 🔧 Advanced Usage

### Multiple Integrations

Send reports to multiple services simultaneously:

> ⚠️ **SECURITY WARNING**: The example below shows API keys/tokens directly in code for demonstration purposes only. **Never expose sensitive credentials in frontend code**. For production applications, use the secure [proxy mode configuration](#🛡️-security-best-practices) instead.

```tsx
const config = {
  integrations: {
    github: {
      repo: 'owner/repo',
      token: 'github-token'
    },
    slack: {
      webhook: 'https://hooks.slack.com/webhook'
    },
    webhook: {
      url: 'https://your-analytics.com/bug-reports'
    }
  }
};
```

### Event Handlers

```tsx
<BugReporter
  config={config}
  onSubmitSuccess={(response) => {
    console.log('Bug report submitted:', response);
    // Analytics tracking
    gtag('event', 'bug_report_submitted', {
      issue_id: response.issueId
    });
  }}
  onSubmitError={(error) => {
    console.error('Submission failed:', error);
    // Error tracking
    Sentry.captureException(error);
  }}
  onOpen={() => {
    console.log('Bug reporter opened');
  }}
  onClose={() => {
    console.log('Bug reporter closed');
  }}
/>
```

### Data Transformation

Modify report data before submission:

```tsx
const config = {
  advanced: {
    transformData: (data) => {
      return {
        ...data,
        // Add custom metadata
        environment: process.env.NODE_ENV,
        version: process.env.REACT_APP_VERSION,
        userId: getCurrentUserId(),
        // Remove sensitive information
        consoleLogs: data.consoleLogs.filter(log => 
          !log.message.includes('password')
        )
      };
    }
  }
};
```

### File Upload Configuration

```tsx
const config = {
  validation: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 5,
    allowedFileTypes: [
      'image/', // All image types
      'text/plain',
      'application/pdf',
      '.log', // By extension
      '.json'
    ]
  }
};
```

## 🛡️ Security Best Practices

⚠️ **CRITICAL SECURITY WARNING**: Never expose API keys, tokens, or sensitive credentials in your frontend code. Always use server-side proxy endpoints for secure integrations.

### Recommended: Proxy Mode (Secure)

For production applications, use proxy mode where API keys stay on your server:

```tsx
// Secure configuration - API keys stay on server
const config = {
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
};
```

### Direct Mode (Development Only)

⚠️ Only use direct mode for development/testing with non-production tokens:

```tsx
// NOT recommended for production - tokens exposed to client
const config = {
  integrations: {
    github: {
      mode: 'direct', // or omit mode (defaults to direct)
      repo: 'owner/repo',
      token: 'github_token' // ⚠️ Exposed to client!
    }
  }
};
```

### Backend API Routes

Create server-side API routes that handle the actual integration calls. Examples for Next.js:

#### GitHub Issues API Route

```typescript
// app/api/bug-report/github/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const bugData = await request.json();
    
    // Your GitHub token stays secure on the server
    const response = await fetch(`https://api.github.com/repos/${process.env.GITHUB_REPO}/issues`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: bugData.title || 'Bug Report',
        body: formatBugReport(bugData),
        labels: ['bug', 'user-report']
      })
    });
    
    const issue = await response.json();
    return Response.json({ 
      success: true, 
      issueId: issue.number.toString(),
      issueUrl: issue.html_url 
    });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to create issue' }, { status: 500 });
  }
}

function formatBugReport(data: any): string {
  // Format your bug report data as needed
  return `## Description\n${data.description}\n\n## Environment\n- URL: ${data.url}\n- User Agent: ${data.userAgent}`;
}
```

#### Linear API Route

```typescript
// app/api/bug-report/linear/route.ts
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const bugData = await request.json();
    
    const mutation = `
      mutation IssueCreate($input: IssueCreateInput!) {
        issueCreate(input: $input) {
          success
          issue { id identifier title url }
        }
      }
    `;
    
    const response = await fetch('https://api.linear.app/graphql', {
      method: 'POST',
      headers: {
        'Authorization': process.env.LINEAR_API_KEY!, // Secure on server
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: mutation,
        variables: {
          input: {
            title: bugData.title || 'Bug Report',
            description: formatLinearReport(bugData),
            teamId: process.env.LINEAR_TEAM_ID!,
            priority: 3
          }
        }
      })
    });
    
    const result = await response.json();
    const issue = result.data?.issueCreate?.issue;
    
    return Response.json({
      success: true,
      issueId: issue.identifier,
      issueUrl: issue.url
    });
  } catch (error) {
    return Response.json({ success: false, error: 'Failed to create Linear issue' }, { status: 500 });
  }
}
```

### Environment Variables (Server-Side)

```bash
# .env.local (server-side only)
GITHUB_TOKEN=github_pat_...
GITHUB_REPO=owner/repo
LINEAR_API_KEY=lin_api_...
LINEAR_TEAM_ID=team_id
```

### Data Sanitization

The bug reporter automatically:
- Redacts sensitive URL parameters
- Excludes elements marked with `data-private`
- Sanitizes console log arguments
- Filters network request headers
- Removes sensitive patterns from logs

### Additional Security Measures

- Always validate and sanitize data on your backend
- Implement rate limiting on your API routes
- Use HTTPS for all endpoints
- Validate API tokens server-side
- Log security events for monitoring
- Consider implementing CSRF protection

## 🎯 Performance

### Bundle Size

- Core library: ~45KB gzipped
- With all integrations: ~65KB gzipped
- Tree-shakable: Only includes used integrations

### Optimization Tips

```tsx
// Lazy load for better performance
const BugReporter = lazy(() => import('@zudsniper/bugs'));

function App() {
  return (
    <Suspense fallback={null}>
      <BugReporter config={config} />
    </Suspense>
  );
}
```

## 🐛 Troubleshooting

### Common Issues

#### Screenshots not capturing

```tsx
// Ensure html2canvas peer dependency is installed
npm install html2canvas

// Or disable screenshots
const config = {
  capture: {
    captureScreenshot: false
  }
};
```

#### Network requests not captured

```tsx
// Make sure capture is started before requests
const config = {
  capture: {
    maxNetworkRequests: 50 // Increase limit
  }
};
```

#### Integration not working

```tsx
// Validate configuration
import { validationManager } from '@zudsniper/bugs';

const validation = validationManager.validateConfig(config);
if (!validation.isValid) {
  console.error('Config errors:', validation.errors);
}
```

### Debug Mode

```tsx
const config = {
  advanced: {
    customLogger: (level, message, data) => {
      console.log(`[BugReporter:${level}] ${message}`, data);
    }
  }
};
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](CONTRIBUTING.md) for details.

### Development Setup

```bash
# Clone the repository
git clone https://github.com/your-username/bug-reporter-popup.git

# Install dependencies
cd bug-reporter-popup
npm install

# Start development
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [html2canvas](https://html2canvas.hertzen.com/) for screenshot functionality
- [Framer Motion](https://www.framer.com/motion/) for smooth animations
- [Lucide React](https://lucide.dev/) for beautiful icons

## 📊 Stats

![npm version](https://img.shields.io/npm/v/@zudsniper/bugs)
![npm downloads](https://img.shields.io/npm/dm/@zudsniper/bugs)
![bundle size](https://img.shields.io/bundlephobia/minzip/@zudsniper/bugs)
![license](https://img.shields.io/npm/l/@zudsniper/bugs)

---

<div align="center">
  <strong>Made with ❤️ for better user feedback</strong>
</div>