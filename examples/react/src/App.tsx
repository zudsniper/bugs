import React from 'react';
import { BugReporter, defaultConfigs } from '@zudsniper/bugs';
import '@zudsniper/bugs/styles';

function App() {
  // Secure configuration using proxy mode for webhook
  const config = {
    integrations: {
      webhook: {
        mode: 'proxy',
        endpoint: '/api/bug-report/webhook'
      }
    },
    ui: {
      theme: 'auto',
      title: 'Send Feedback',
      submitButtonText: 'Submit Report'
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>React App with Bug Reporter</h1>
        <p>This React app includes bug reporting functionality.</p>
      </header>
      
      <main>
        <button onClick={() => console.error('Test error for bug reporting')}>
          Generate Test Error
        </button>
        
        <button onClick={() => fetch('/api/test-endpoint')}>
          Make Test API Call
        </button>
      </main>
      
      <BugReporter config={config} />
    </div>
  );
}

export default App;