import { useState } from 'react';
import DiscussionSection from './components/DiscussionSection';
import './App.css';

function App() {
  // For standalone demo, use a default context ID
  // In embedded mode, this would be passed as a prop
  const [contextId] = useState('demo-context-1');
  const [contextType] = useState('campaign');

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
    </div>
  );
}

export default App;
