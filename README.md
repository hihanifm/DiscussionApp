# Discussion App

A standalone, modular Reddit-style discussion component that can run independently or be embedded into any project.

**Status:** Independent project - can be hosted on separate frontend and backend servers.

## Features

- ✅ **Threaded Comments** - Nested replies with unlimited depth
- ✅ **Thumbs-up Voting** - Simple upvote system (toggle on/off)
- ✅ **Real-time Updates** - Server-Sent Events (SSE) for live updates
- ✅ **Search & Sort** - Search comments and sort by Best/Newest/Oldest
- ✅ **Modular Design** - Can be embedded anywhere or run standalone
- ✅ **Configurable** - Use existing database or create new one
- ✅ **Independent Servers** - Separate frontend and backend

## Quick Start

### Installation

```bash
# Install all dependencies
npm run install:all

# Or install separately
cd backend && npm install
cd ../frontend && npm install
```

### Development

**Option 1: Using background scripts (recommended)**
```bash
# Start servers in background
./start-background.sh

# Check status
./status-background.sh

# Stop servers
./stop-background.sh
```

**Option 2: Using npm scripts**
```bash
# Run both frontend and backend
npm run dev

# Or run separately
npm run dev:backend  # Backend on http://localhost:3001
npm run dev:frontend # Frontend on http://localhost:4000
```

### Production

**Using background scripts:**
```bash
# Start in production mode
./start-background.sh --prod

# Or with Vite proxy enabled
./start-background.sh --prod --vite-proxy
```

**Using npm scripts:**
```bash
# Build frontend
npm run build

# Start backend
npm start
```

## Configuration

### Backend Configuration

Environment variables:

- `PORT` - Backend port (default: 3001)
- `HOST` - Backend host (default: 127.0.0.1, use 0.0.0.0 for network access)
- `DB_PATH` - Database file path (default: `backend/data/discussion.db`)
- `FRONTEND_URL` - Frontend URL for CORS (e.g., `http://localhost:4000`)
- `FRONTEND_URLS` - Multiple frontend URLs (comma-separated)
- `NODE_ENV` - Set to `production` for strict origin validation

### Frontend Configuration

Environment variables (via `.env` or `vite.config.js`):

- `VITE_API_URL` - Backend API URL (default: `http://localhost:3001`)
- `VITE_USE_PROXY` - Use Vite proxy (default: `true`)

## Usage

### Standalone Mode

The app runs as a complete standalone application with its own frontend and backend.

```jsx
// App.jsx already includes DiscussionSection
import DiscussionSection from './components/DiscussionSection';

<DiscussionSection 
  contextId="my-context-id" 
  contextType="campaign" 
/>
```

### Embedded Mode

Embed the `DiscussionSection` component into any React application:

```jsx
import DiscussionSection from './components/DiscussionSection';

function MyApp() {
  return (
    <div>
      <h1>My Application</h1>
      <DiscussionSection 
        contextId="campaign-123" 
        contextType="campaign" 
      />
    </div>
  );
}
```

### Using Existing Database

To use an existing database, set the `DB_PATH` environment variable:

```bash
DB_PATH=/path/to/existing.db npm start
```

The schema will be created automatically if tables don't exist.

## API Endpoints

### GET `/api/discussion/:contextId/comments`
Get all comments for a context (threaded).

Query params:
- `context_type` - Type of context (default: `campaign`)

### POST `/api/discussion/:contextId/comments`
Create a new comment or reply.

Body:
```json
{
  "comment_text": "Your comment here",
  "parent_id": null,  // null for top-level, comment ID for reply
  "user_id": "user-id",
  "context_type": "campaign"
}
```

### POST `/api/discussion/comments/:id/upvote`
Toggle upvote on a comment.

Body:
```json
{
  "user_id": "user-id"
}
```

### DELETE `/api/discussion/comments/:id`
Delete a comment (creator only).

Body:
```json
{
  "user_id": "user-id"
}
```

### GET `/api/sse/discussion/:contextId`
SSE endpoint for real-time updates.

## Database Schema

- `discussion_comments` - Comments table with threading support
- `discussion_comment_votes` - Votes table (thumbs-up only)

## Background Scripts

The project includes three management scripts:

- **`start-background.sh`** - Start both servers in background
  - `./start-background.sh` - Development mode (default)
  - `./start-background.sh --prod` - Production mode
  - `./start-background.sh --prod --vite-proxy` - Production with Vite proxy

- **`status-background.sh`** - Check server status, ports, and mode

- **`stop-background.sh`** - Stop all running servers

All scripts support both development and production modes, with automatic port detection and process management.

## Project Structure

```
discussion-app/
├── backend/
│   ├── src/
│   │   ├── server.js
│   │   ├── db/
│   │   │   ├── database.js
│   │   │   └── schema.sql
│   │   ├── routes/
│   │   │   ├── discussion.js
│   │   │   └── sse.js
│   │   ├── services/
│   │   │   └── sseService.js
│   │   └── middleware/
│   │       ├── errorHandler.js
│   │       └── validateOrigin.js
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DiscussionSection.jsx
│   │   │   ├── DiscussionSection.css
│   │   │   ├── Comment.jsx
│   │   │   └── Comment.css
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── config/
│   │   │   └── apiConfig.js
│   │   ├── utils/
│   │   │   ├── dateFormat.js
│   │   │   └── userId.js
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
└── package.json
```

## License

ISC
