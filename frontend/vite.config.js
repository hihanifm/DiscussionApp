import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const useProxy = process.env.VITE_USE_PROXY !== 'false';
  const backendUrl = process.env.VITE_API_URL || 'http://localhost:4001';

  const proxyConfig = useProxy ? {
    '/api': {
      target: backendUrl,
      changeOrigin: true,
      configure: (proxy, options) => {
        proxy.on('proxyReq', (proxyReq, req, res) => {
          if (req.headers.origin) {
            proxyReq.setHeader('origin', req.headers.origin);
          }
          if (req.headers.referer) {
            proxyReq.setHeader('referer', req.headers.referer);
          }
        });
      }
    }
  } : {};

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 4000,
      ...(useProxy && { proxy: proxyConfig })
    },
    preview: {
      host: '0.0.0.0',
      port: 4000
    }
  }
})
