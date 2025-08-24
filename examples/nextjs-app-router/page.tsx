'use client';

import { BugReporter, defaultConfigs, mergeConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

export default function HomePage() {
  // Secure configuration using proxy mode - API keys stay on server
  const config = mergeConfigs(
    {
      integrations: {
        github: {
          mode: 'proxy',
          endpoint: '/api/bug-report/github'
        }
      }
    },
    defaultConfigs.production(),
    {
      ui: {
        title: 'Report a Bug',
        subtitle: 'Help us improve by reporting any issues you encounter',
        primaryColor: '#3b82f6',
        position: 'bottom-right'
      },
      validation: {
        requireEmail: true
      }
    }
  );

  return (
    <div>
      <h1>My Next.js App</h1>
      <p>This is a sample application with bug reporting functionality.</p>
      
      {/* Bug Reporter Widget */}
      <BugReporter
        config={config}
        onSubmitSuccess={(response) => {
          console.log('Bug report submitted:', response);
        }}
        onSubmitError={(error) => {
          console.error('Bug report failed:', error);
        }}
      />
    </div>
  );
}