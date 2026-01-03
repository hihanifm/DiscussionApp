import { useState } from 'react';
import DiscussionSection from './components/DiscussionSection';
import './App.css';

function App() {
  // For standalone demo, use a default context ID
  // In embedded mode, this would be passed as a prop
  const [contextId] = useState('demo-context-1');
  const [contextType] = useState('campaign');

  // Determine if we're in development or production mode
  const isDev = import.meta.env.DEV;
  const mode = isDev ? 'DEV' : 'PROD';

  return (
    <div className="app">
      <div className="app-header">
        <h1>Discussion App</h1>
        <p>Standalone Reddit-style discussion component</p>
        <p className="app-context">Context ID: {contextId}</p>
      </div>
      
      <DiscussionSection 
        contextId={contextId} 
        contextType={contextType}
      />

      <div className={`app-footer ${isDev ? 'app-footer-dev' : 'app-footer-prod'}`}>
        <span className="app-mode">
          Mode: <strong className={isDev ? 'mode-dev' : 'mode-prod'}>{mode}</strong>
        </span>
      </div>
    </div>
  );
}

export default App;
