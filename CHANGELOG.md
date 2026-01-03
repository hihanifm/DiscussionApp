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
