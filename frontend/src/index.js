// Import CSS files to ensure they're bundled
import './components/DiscussionSection.css';
import './components/Comment.css';

// Export all discussion components and utilities
export { default as DiscussionSection } from './components/DiscussionSection.jsx';
export { default as Comment } from './components/Comment.jsx';
export { default as AutoExpandingTextarea } from './components/AutoExpandingTextarea.jsx';
export { api } from './services/api.js';
export { API_BASE_URL, SSE_BASE_URL, apiConfig } from './config/apiConfig.js';
