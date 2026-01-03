/**
 * Middleware to validate that requests come from the frontend application
 * Configurable to allow different origins
 */

const getAllowedOrigins = () => {
  const allowedOrigins = [];
  
  // Add localhost origins (development)
  allowedOrigins.push('http://localhost:4000');
  allowedOrigins.push('http://127.0.0.1:4000');
  allowedOrigins.push('http://localhost:3000');
  allowedOrigins.push('http://127.0.0.1:3000');
  
  // Add environment variable for custom frontend URL (production)
  if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
  }
  
  // Allow multiple frontend URLs (comma-separated)
  if (process.env.FRONTEND_URLS) {
    process.env.FRONTEND_URLS.split(',').forEach(url => {
      const trimmed = url.trim();
      if (trimmed) {
        allowedOrigins.push(trimmed);
      }
    });
  }
  
  return allowedOrigins;
};

const allowedOrigins = getAllowedOrigins();

const isFrontendPort = (urlString) => {
  try {
    const url = new URL(urlString);
    const port = url.port || (url.protocol === 'https:' ? '443' : '80');
    return port === '4000' || port === '3000';
  } catch (e) {
    return false;
  }
};

const isOriginAllowed = (req) => {
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  
  if (origin) {
    const originNormalized = origin.endsWith('/') ? origin.slice(0, -1) : origin;
    
    if (allowedOrigins.some(allowed => {
      const allowedNormalized = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
      return originNormalized === allowedNormalized;
    })) {
      return true;
    }
    
    if (process.env.ALLOW_ANY_FRONTEND_PORT !== 'false' && isFrontendPort(origin)) {
      return true;
    }
  }
  
  if (referer) {
    try {
      const refererUrl = new URL(referer);
      const refererOrigin = `${refererUrl.protocol}//${refererUrl.host}`;
      const refererOriginNormalized = refererOrigin.endsWith('/') ? refererOrigin.slice(0, -1) : refererOrigin;
      
      if (allowedOrigins.some(allowed => {
        const allowedNormalized = allowed.endsWith('/') ? allowed.slice(0, -1) : allowed;
        return refererOriginNormalized === allowedNormalized;
      })) {
        return true;
      }
      
      if (process.env.ALLOW_ANY_FRONTEND_PORT !== 'false' && isFrontendPort(refererOrigin)) {
        return true;
      }
    } catch (e) {
      // Invalid referer URL
    }
  }
  
  // In development, be more lenient
  const isProduction = process.env.NODE_ENV === 'production';
  
  if (!origin && !referer) {
    if (isProduction) {
      return false;
    }
    
    if (process.env.ALLOW_NO_ORIGIN === 'true') {
      return true;
    }
    
    const clientIp = req.ip || req.connection.remoteAddress || req.socket.remoteAddress;
    if (clientIp === '127.0.0.1' || clientIp === '::1' || clientIp === '::ffff:127.0.0.1') {
      return true;
    }
    
    return false;
  }
  
  if (isProduction) {
    return false;
  }
  
  if (origin) {
    try {
      const originUrl = new URL(origin);
      const isLocalhost = originUrl.hostname === 'localhost' || 
                         originUrl.hostname === '127.0.0.1' ||
                         originUrl.hostname.startsWith('192.168.') ||
                         originUrl.hostname.startsWith('10.') ||
                         originUrl.hostname.startsWith('172.');
      
      if (isLocalhost) {
        return true;
      }
    } catch (e) {
      // Invalid origin URL
    }
  }
  
  return false;
};

const validateOrigin = (req, res, next) => {
  if (req.path === '/api/health') {
    return next();
  }
  
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  if (!isOriginAllowed(req)) {
    return res.status(403).json({
      error: 'Forbidden: Direct API access is not allowed. Please use the frontend application.'
    });
  }
  
  next();
};

module.exports = validateOrigin;
