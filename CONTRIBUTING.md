# Contributing to Bug Reporter Popup

Thank you for your interest in contributing to Bug Reporter Popup! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm, yarn, or pnpm
- Git

### Development Setup

1. Fork the repository on GitHub
2. Clone your fork locally:

```bash
git clone https://github.com/your-username/bug-reporter-popup.git
cd bug-reporter-popup
```

3. Install dependencies:

```bash
npm install
```

4. Start development:

```bash
npm run dev
```

5. Run tests:

```bash
npm test
```

## 🏗️ Project Structure

```
src/
├── components/        # React components
├── core/             # Core functionality (capture, etc.)
├── integrations/     # Integration adapters
├── styles/           # CSS styles
├── types/            # TypeScript type definitions
├── utils/            # Utility functions
└── index.ts          # Main entry point

examples/             # Usage examples
├── nextjs-app-router/
├── nextjs-pages-router/
├── react/
├── vite/
└── vanilla-js/

tests/                # Test files
docs/                 # Documentation
```

## 📝 Development Guidelines

### Code Style

We use ESLint and TypeScript for code quality:

```bash
# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type check
npm run type-check
```

### Commit Messages

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Test changes
- `chore:` Build process or auxiliary tool changes

Examples:
```
feat: add Jira integration support
fix: resolve screenshot capture on mobile browsers
docs: update installation instructions
```

### Testing

- Write tests for new features and bug fixes
- Maintain test coverage above 80%
- Run tests before submitting PRs:

```bash
npm test
npm run test:coverage
```

### TypeScript

- Use strict TypeScript configuration
- Export all public types
- Add JSDoc comments for public APIs
- Avoid `any` type when possible

## 🔧 Contributing Types

### 🐛 Bug Fixes

1. Search existing issues to avoid duplicates
2. Create a detailed bug report if none exists
3. Write a failing test that reproduces the bug
4. Fix the bug and ensure tests pass
5. Update documentation if necessary

### ✨ New Features

1. Check if the feature aligns with project goals
2. Create a feature request issue for discussion
3. Wait for approval before starting work
4. Write comprehensive tests
5. Update documentation and examples
6. Consider backward compatibility

### 🎨 UI/UX Improvements

1. Follow existing design patterns
2. Ensure accessibility compliance
3. Test across different browsers and devices
4. Consider theme compatibility
5. Update style documentation

### 🔌 New Integrations

When adding new integrations:

1. Extend the `BaseIntegration` class
2. Implement all required methods
3. Add proper error handling and validation
4. Write comprehensive tests
5. Add configuration schema
6. Update documentation with usage examples

Example integration structure:

```typescript
export class NewServiceIntegration extends BaseIntegration {
  name = 'newservice';
  
  async submit(data: BugReportData, config: NewServiceConfig): Promise<SubmissionResponse> {
    // Implementation
  }
  
  validateConfig(config: any): boolean {
    // Validation logic
  }
  
  getConfigSchema() {
    // JSON schema for configuration
  }
}
```

## 📋 Pull Request Process

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**:
   - Follow code style guidelines
   - Write/update tests
   - Update documentation

3. **Test thoroughly**:
   ```bash
   npm test
   npm run lint
   npm run type-check
   ```

4. **Update documentation**:
   - Update README.md if needed
   - Add/update code examples
   - Update CHANGELOG.md

5. **Submit PR**:
   - Use a descriptive title
   - Fill out the PR template
   - Link related issues
   - Add screenshots for UI changes

6. **Address feedback**:
   - Respond to review comments
   - Make requested changes
   - Re-request review when ready

## 🧪 Testing Guidelines

### Unit Tests

Write unit tests for:
- Utility functions
- Integration adapters
- Core functionality
- Component logic

```typescript
// Example test
import { validationManager } from '../validation';

describe('ValidationManager', () => {
  it('should validate email format', () => {
    expect(validationManager.isValidEmail('test@example.com')).toBe(true);
    expect(validationManager.isValidEmail('invalid-email')).toBe(false);
  });
});
```

### Integration Tests

Test integration adapters with mock APIs:

```typescript
import { GitHubIntegration } from '../integrations/github';

describe('GitHubIntegration', () => {
  it('should create GitHub issue', async () => {
    // Mock fetch
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ number: 123, html_url: 'https://...' })
    });
    
    const integration = new GitHubIntegration();
    const result = await integration.submit(mockData, mockConfig);
    
    expect(result.success).toBe(true);
    expect(result.issueId).toBe('123');
  });
});
```

### Component Tests

Test React components with Testing Library:

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { BugReporter } from '../BugReporter';

describe('BugReporter', () => {
  it('should open popup when trigger is clicked', () => {
    render(<BugReporter config={mockConfig} />);
    
    const trigger = screen.getByLabelText('Report a bug');
    fireEvent.click(trigger);
    
    expect(screen.getByText('Report an Issue')).toBeInTheDocument();
  });
});
```

## 📚 Documentation

### API Documentation

Document all public APIs with JSDoc:

```typescript
/**
 * Captures a screenshot of the current page
 * @param options - Screenshot capture options
 * @returns Promise that resolves to base64 image data or undefined
 */
async captureScreenshot(options?: ScreenshotOptions): Promise<string | undefined>
```

### Usage Examples

Provide practical examples for new features:

```typescript
// Add example to README.md
const config = {
  integrations: {
    newservice: {
      apiKey: 'your-api-key',
      projectId: 'project-id'
    }
  }
};
```

### Migration Guides

For breaking changes, provide migration guides:

```markdown
## Migrating from v1.x to v2.x

### Changed APIs

- `oldMethod()` → `newMethod()`
- `oldConfig.prop` → `newConfig.newProp`

### Migration Steps

1. Update configuration structure
2. Replace deprecated method calls
3. Update import statements
```

## 🔍 Code Review

### What to Look For

As a reviewer:
- Code follows project conventions
- Tests cover new functionality
- Documentation is updated
- No breaking changes without migration path
- Performance implications considered
- Security best practices followed

### What to Avoid

- Blocking PRs for minor style preferences
- Requesting changes without explanation
- Ignoring test failures or type errors

## 🚢 Release Process

Releases are automated but follow this process:

1. **Version Bump**: Update `package.json` version
2. **Changelog**: Update `CHANGELOG.md` with changes
3. **Tag**: Create and push a git tag
4. **CI/CD**: Automated build and publish to npm
5. **GitHub Release**: Create release notes

## 📞 Getting Help

- **Issues**: Create GitHub issues for bugs or features
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our development Discord server
- **Email**: Contact maintainers for security issues

## 🎯 Project Goals

Our primary goals are:

1. **Developer Experience**: Make bug reporting integration effortless
2. **User Experience**: Provide intuitive, accessible reporting interface
3. **Privacy**: Respect user privacy and data protection
4. **Performance**: Minimal impact on host applications
5. **Compatibility**: Support major React frameworks and versions

## ❤️ Recognition

Contributors are recognized in:
- `README.md` contributors section
- Release notes
- Annual contributor appreciation posts

Thank you for contributing to Bug Reporter Popup!

---

*For questions about contributing, please create a discussion or reach out to the maintainers.*