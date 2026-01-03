/**
 * API Configuration
 * Configurable API endpoints for the discussion component
 */

const USE_PROXY = import.meta.env.VITE_USE_PROXY !== 'false';
const BACKEND_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const API_BASE_URL = USE_PROXY ? '/api' : `${BACKEND_URL}/api`;
export const SSE_BASE_URL = USE_PROXY ? '/api/sse' : `${BACKEND_URL}/api/sse`;

export const apiConfig = {
  useProxy: USE_PROXY,
  backendUrl: BACKEND_URL,
  apiBaseUrl: API_BASE_URL,
  sseBaseUrl: SSE_BASE_URL,
};

if (import.meta.env.DEV) {
  console.log('Discussion API Configuration:', apiConfig);
}
