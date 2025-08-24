import { BugReporter, defaultConfigs, mergeConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

export default function HomePage() {
  // Secure configuration using proxy mode - API keys stay on server
  const config = mergeConfigs(
    {
      integrations: {
        linear: {
          mode: 'proxy',
          endpoint: '/api/bug-report/linear'
        }
      }
    },
    {
      ui: {
        title: 'Feedback',
        theme: 'light',
        position: 'bottom-left'
      },
      keyboard: {
        openShortcut: ['ctrl', 'shift', 'b']
      }
    }
  );

  return (
    <div>
      <h1>My Next.js Pages Router App</h1>
      <p>Press Ctrl+Shift+B to open the bug reporter, or click the floating button.</p>
      
      <BugReporter
        config={config}
        onOpen={() => console.log('Bug reporter opened')}
        onClose={() => console.log('Bug reporter closed')}
      />
    </div>
  );
}