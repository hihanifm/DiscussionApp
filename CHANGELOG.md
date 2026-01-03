## [2.0.0] - 2026-01-03

### Added
- Library packaging as @townhall/discussion npm package
- Library entry point (src/index.js) with exports for components and services
- Support for separate DiscussionApp backend URL configuration (VITE_DISCUSSION_API_URL)
- Support for separate proxy configuration (VITE_DISCUSSION_USE_PROXY)

### Changed
- Refactored to use @townhall/shared library for common utilities (userId, dateFormat)
- Updated package.json to configure as npm library package with proper exports
- Updated backend CORS to allow TownhallQAPoll frontend (port 3000)
- Updated all imports to use shared library utilities instead of local copies
- Updated apiConfig to support separate environment variables for DiscussionApp backend

### Fixed
- 

---

## [1.2.0] - 2026-01-02

### Added
- Auto-expanding textarea component that starts as a single line and expands as user types
- Excalidraw font (Excalifont) for comment text, matching Townhall project style
- Bottom bar footer displaying current mode (DEV/PROD) with color-coded indicators

### Changed
- Comment input and reply textareas now use auto-expanding behavior instead of fixed height
- Comment text now uses Excalifont for improved readability and consistency

### Fixed
- 

---

## [1.1.0] - 2026-01-02

### Added
- Comprehensive test suite with 39 tests (15 backend, 24 frontend)
- Backend tests using Jest and Supertest for discussion API routes
- Frontend tests using Vitest and Testing Library for utilities, API service, and config
- Test database setup with foreign key support for CASCADE deletes
- Test coverage reporting for both backend and frontend
- Foreign key support enabled in production database for proper CASCADE deletes

### Changed
- Updated test scripts in package.json files to use Jest (backend) and Vitest (frontend)
- Enhanced database initialization to enable foreign keys for data integrity

### Fixed
- 

---

## [1.0.4] - 2026-01-02

### Fixed
- SSE: Comment component now syncs vote count state with SSE updates
- Upvote changes are now reflected in real-time for all users via SSE

---

## [1.0.3] - 2026-01-02

### Changed
- Default sort option changed from "Best" to "Newest"
- Sort preference now persists in localStorage across page refreshes
- Optimized SSE: Update state directly instead of reloading all comments

---

## [1.0.2] - 2026-01-02

### Changed
- Backend port changed from 3001 to 4001 to avoid conflict with Townhall project

---

## [1.0.1] - 2026-01-02

### Changed
- Frontend port changed from 3000 to 4000 to avoid conflict with Townhall project

---

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-02

### Added
- Initial release: Standalone discussion application
- Threaded comments with unlimited nesting depth
- Thumbs-up voting system (toggle on/off)
- Real-time updates via Server-Sent Events (SSE)
- Comment search functionality
- Sort options: Best, Newest, Oldest
- Modular design for embedding or standalone use
- Configurable database (existing or new)
- Independent frontend and backend servers
- Background management scripts (start, status, stop)
- Development and production modes
- CORS support with configurable origins

---

## Version History

- **1.0.0** - Initial release

---

## Versioning Guide

This project follows [Semantic Versioning](https://semver.org/):

- **MAJOR** (X.0.0): Breaking changes that require migration or API changes
- **MINOR** (x.Y.0): New features that are backward compatible
- **PATCH** (x.y.Z): Bug fixes and small improvements

### Examples:
- `1.0.0 → 2.0.0`: Breaking database schema change, API endpoint removal
- `1.0.0 → 1.1.0`: New feature (new endpoint, new UI component)
- `1.1.0 → 1.1.1`: Bug fix, documentation update, small improvement
