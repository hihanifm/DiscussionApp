const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');
const validateOrigin = require('./middleware/validateOrigin');
const discussionRouter = require('./routes/discussion');
const sseRouter = require('./routes/sse');

const app = express();
const PORT = process.env.PORT || 4001;

// Configure allowed origins for CORS
const getAllowedOrigins = () => {
  const origins = [];
  
  // Development origins
  origins.push('http://localhost:4000');
  origins.push('http://127.0.0.1:4000');
  origins.push('http://localhost:3000');
  origins.push('http://127.0.0.1:3000');
  
  // Production frontend URL from environment
  if (process.env.FRONTEND_URL) {
    origins.push(process.env.FRONTEND_URL);
  }
  
  // Multiple frontend URLs (comma-separated)
  if (process.env.FRONTEND_URLS) {
    process.env.FRONTEND_URLS.split(',').forEach(url => {
      const trimmed = url.trim();
      if (trimmed) {
        origins.push(trimmed);
      }
    });
  }
  
  return origins;
};

const allowedOrigins = getAllowedOrigins();

// CORS configuration
const isDevelopment = process.env.NODE_ENV !== 'production';

app.use(cors({
  origin: function (origin, callback) {
    if (isDevelopment) {
      if (!origin) {
        return callback(null, true);
      }
      
      try {
        const originUrl = new URL(origin);
        const isLocalhost = originUrl.hostname === 'localhost' || 
                           originUrl.hostname === '127.0.0.1' ||
                           originUrl.hostname.startsWith('192.168.') ||
                           originUrl.hostname.startsWith('10.') ||
                           originUrl.hostname.startsWith('172.');
        
        if (isLocalhost) {
          return callback(null, true);
        }
      } catch (e) {
        // Invalid origin URL
      }
    }
    
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else if (process.env.ALLOW_ANY_FRONTEND_PORT !== 'false' && 
               (origin.includes(':4000') || origin.includes(':4001') || origin.includes(':3000'))) {
      callback(null, true);
    } else {
      if (isDevelopment) {
        console.warn(`CORS: Blocked origin: ${origin}`);
      }
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400
}));

app.set('trust proxy', true);

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Validate origin middleware
app.use(validateOrigin);

// Routes
app.use('/api/discussion', discussionRouter);
app.use('/api/sse', sseRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handling
app.use(errorHandler);

// Start server
const HOST = process.env.HOST || '127.0.0.1';
const BIND_ALL = process.env.HOST === '0.0.0.0' || process.env.ALLOW_REMOTE === 'true';

if (BIND_ALL) {
  console.log('⚠️  WARNING: Backend is bound to 0.0.0.0 - accessible from network');
} else {
  console.log('✓ Backend bound to localhost only');
  console.log('   Set HOST=0.0.0.0 to allow remote access');
}

if (isDevelopment) {
  console.log('🔓 Development mode: Origin validation is more permissive');
} else {
  console.log('🔒 Production mode: Strict origin validation enabled');
}

app.listen(PORT, HOST, () => {
  console.log(`Discussion API server running on http://${HOST}:${PORT}`);
  console.log(`Local access: http://localhost:${PORT}`);
  if (BIND_ALL) {
    console.log(`Network access: http://<your-ip>:${PORT}`);
  }
  console.log(`Database: ${process.env.DB_PATH || 'backend/data/discussion.db'}`);
});
