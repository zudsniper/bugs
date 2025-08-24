import { BugReporter, defaultConfigs, mergeConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

// Custom trigger example
const customTrigger = document.createElement('button');
customTrigger.textContent = '🐛 Report Issue';
customTrigger.className = 'custom-bug-button';
customTrigger.style.cssText = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: #dc2626;
  color: white;
  border: none;
  padding: 10px 15px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 14px;
  z-index: 1000;
`;

document.body.appendChild(customTrigger);

// Initialize bug reporter with secure proxy configuration
const config = {
  integrations: {
    slack: {
      mode: 'proxy',
      endpoint: '/api/bug-report/slack'
    }
  },
  ui: {
    theme: 'dark',
    title: 'Report to Team',
    submitButtonText: 'Send to Slack',
    fields: [
      {
        type: 'text',
        key: 'title',
        label: 'Issue Title',
        required: true
      },
      {
        type: 'select',
        key: 'category',
        label: 'Category',
        options: [
          { value: 'bug', label: 'Bug' },
          { value: 'feature', label: 'Feature Request' },
          { value: 'improvement', label: 'Improvement' }
        ],
        required: true
      },
      {
        type: 'textarea',
        key: 'description',
        label: 'Description',
        placeholder: 'Describe the issue in detail...',
        required: true
      }
    ]
  }
};

// Create React root and render
import { createRoot } from 'react-dom/client';
import { createElement } from 'react';

const container = document.createElement('div');
document.body.appendChild(container);

const root = createRoot(container);
root.render(
  createElement(BugReporter, {
    config,
    children: customTrigger
  })
);