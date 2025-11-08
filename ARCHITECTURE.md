# Gitoscope Architecture

This document describes the architecture, design decisions, and key implementation details of Gitoscope.

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture Layers](#architecture-layers)
- [Core Components](#core-components)
- [Data Flow](#data-flow)
- [Git Integration](#git-integration)
- [Design Decisions](#design-decisions)
- [Future Considerations](#future-considerations)

## Overview

Gitoscope is a single-page web application that provides real-time visualization of Git repository internals. The architecture follows a traditional server-rendered model with a React-based frontend for interactive visualization.

### Key Architectural Goals

1. **Educational Focus**: Clear separation of concerns to help users understand Git internals
2. **Real-time Reflection**: Changes to the repository immediately visible in the UI
3. **Minimal Dependencies**: Simple, maintainable codebase with few external dependencies
4. **Performance**: Efficient Git operations using native git commands

## Technology Stack

### Backend

- **Runtime**: Node.js 22+ (LTS)
- **Framework**: Express.js 4.x
- **Git Integration**: simple-git (wrapper around native git commands)
- **Template Engine**: Pug (for server-side rendering)

### Frontend

- **UI Library**: React (loaded via CDN, not bundled)
- **Visualization**: Cytoscape.js with Dagre layout
- **Styling**: Vanilla CSS

### Development Tools

- **Testing**: Jest with Supertest
- **Linting**: ESLint with Prettier integration
- **Formatting**: Prettier

## Architecture Layers

Gitoscope follows a layered architecture:

```
┌─────────────────────────────────────┐
│         Frontend (React)            │
│  ┌──────────┐      ┌──────────┐    │
│  │ Index    │      │ Internals│    │
│  │ View     │      │ View     │    │
│  └──────────┘      └──────────┘    │
└─────────────┬───────────────────────┘
              │ HTTP/JSON
┌─────────────▼───────────────────────┐
│      Express.js Application         │
│  ┌──────────────────────────────┐  │
│  │   Routes (URL mapping)       │  │
│  └────────┬─────────────────────┘  │
│           │                         │
│  ┌────────▼─────────────────────┐  │
│  │   Controllers (Handlers)     │  │
│  └────────┬─────────────────────┘  │
└───────────┼─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│      Git Operations Layer           │
│  ┌──────────────────────────────┐  │
│  │   lib/git.js                 │  │
│  │   (simple-git wrapper)       │  │
│  └──────────────────────────────┘  │
└───────────┬─────────────────────────┘
            │
┌───────────▼─────────────────────────┐
│      Data Models Layer              │
│  ┌──────────────────────────────┐  │
│  │   lib/gitModels.js           │  │
│  │   (Factory functions)        │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

## Core Components

### 1. Application Bootstrap (`app.js`, `bin/www`)

**Purpose**: Initialize and configure the Express application

**Responsibilities**:

- Load and validate configuration
- Set up middleware (logging, body parsing, static files)
- Register routes
- Configure error handlers
- Start HTTP server

**Key Features**:

- Configuration validation (exits if `config.js` missing)
- Development vs production error handling
- Configurable port via environment variable

### 2. Routes Layer (`routes/`)

**Purpose**: Define URL-to-handler mappings

**Files**:

- `routes/index.js`: View routes (renders HTML pages)
- `routes/api.js`: API routes (returns JSON data)

**API Route Patterns**:

```
GET /api/status                      - File status information
GET /api/HEAD/entries/:name          - File content from HEAD
GET /api/workingCopy/entries/:name   - File from working directory
GET /api/cache/entries/:name         - File from staging area
GET /api/commits/:commitId           - Commit object details
GET /api/trees/:treeId               - Tree object details
GET /api/blobs/:blobId               - Blob object details
GET /api/references                  - All Git references (branches, tags)
```

### 3. Controllers Layer (`controllers/apiController.js`)

**Purpose**: Handle HTTP requests and coordinate responses

**Pattern**: Factory functions that create async request handlers

**Key Functions**:

```javascript
// Creates a handler for parameterless git operations
promiseResponseFactory(gitFunction);

// Creates a handler for operations requiring a parameter
parametricResponse(gitFunction, paramName);
```

**Error Handling**: All handlers use try-catch to forward errors to Express error middleware

### 4. Git Operations Layer (`lib/git.js`)

**Purpose**: Abstract all Git operations using simple-git and native git commands

**Key Functions**:

- `getRepo()`: Returns configured simple-git instance
- `getStatus()`: Comprehensive file status across working copy, staging, and HEAD
- `getListOfFilesInHeadCommit()`: Lists all tracked files in HEAD
- `getWorkingCopyContent(name)`: Retrieves file from working directory
- `getCacheContent(name)`: Retrieves file from staging area
- `getTreeContent(name)`: Retrieves file from HEAD commit
- `getCommit(commitId)`: Retrieves commit object with metadata
- `getTreeRest(treeId)`: Retrieves tree object with entries
- `getBlobRest(blobId)`: Retrieves blob object with content
- `getReferences()`: Lists all refs (branches, tags, HEAD)

**Implementation Details**:

- Uses async/await throughout
- Combines simple-git API with native git commands via `child_process.exec`
- Parses git raw object formats (commits, trees, blobs)
- Computes diffs between working copy, staging, and HEAD

### 5. Data Models Layer (`lib/gitModels.js`)

**Purpose**: Transform Git objects into API-friendly JSON structures

**Factory Functions**:

```javascript
commitFactory(data);    // Commit → JSON with parent/tree links
treeFactory(data);      // Tree → JSON with entry list
blobFactory(data);      // Blob → JSON with content
referenceFactory(data); // Reference → JSON with symbolic/direct info
```

**Features**:

- Generates hypermedia-style REST URLs (e.g., `/api/trees/:id`)
- Normalizes data structures across different Git object types
- Handles binary vs text content

### 6. Frontend Components (`public/javascripts/`)

**React Components**:

- `Gitoscope.jsx`: Main component for index view (working copy, staging, HEAD)
- `Header.jsx`: Table header component
- `Table.jsx`: Reusable table component
- `Row.jsx`: Table row component
- `reactClient.js`: Entry point and data fetching

**Visualization**:

- `internals.js`: Cytoscape.js-based graph visualization for Git object model
- Renders commits, trees, and blobs as nodes
- Shows relationships as directed edges

## Data Flow

### Status and File Content Request Flow

```
1. User opens browser → Server renders Pug template
2. React app loads → Fetches /api/status
3. Git Operations Layer:
   - Executes git status
   - Compares working copy ↔ staging ↔ HEAD
   - Returns file-by-file status
4. Controllers transform to JSON
5. React renders tables (working copy | staging | HEAD)
6. User clicks file → Fetches /api/{area}/entries/:name
7. Git Operations Layer retrieves content
8. React displays file content with diff highlighting
```

### Internals Graph Request Flow

```
1. User navigates to /internals
2. React app fetches /api/references
3. User selects a commit → Fetches /api/commits/:id
4. Controller calls git.getCommit()
5. Git layer uses 'git cat-file -p' to read commit object
6. Data models create JSON with tree/parent links
7. User clicks tree → Fetches /api/trees/:id
8. Cytoscape.js updates graph visualization
```

## Git Integration

### Why simple-git?

After migrating from NodeGit (native C++ bindings), we chose simple-git:

**Advantages**:

- Pure JavaScript (no native compilation)
- Wraps native git commands (excellent compatibility)
- Simpler build process (no libgit2 dependencies)
- Works seamlessly with Node.js 22+
- Active maintenance

**Tradeoffs**:

- Requires git binary installed on system
- Slight performance overhead from process spawning
- For educational tool, benefits outweigh costs

### Git Command Patterns

Gitoscope uses a hybrid approach:

1. **simple-git API** for high-level operations:

   ```javascript
   const git = simpleGit(repository);
   const status = await git.status();
   const log = await git.log();
   ```

2. **Direct git commands** for object-level access:
   ```javascript
   const { stdout } = await execAsync(`git cat-file -p ${commitId}`, { cwd: repository });
   ```

### Status Calculation

The status logic tracks three states per file:

```javascript
{
  fileName: 'example.js',
  isInWorkingCopy: true,    // File exists in working dir
  isInCache: true,          // File staged for commit
  isInTree: true,           // File exists in HEAD
  diffString: 'modified',   // Working vs cache
  diffCachedString: 'added' // Cache vs HEAD
}
```

This enables the UI to show:

- Untracked files (working only)
- Staged changes (cache differs from HEAD)
- Unstaged changes (working differs from cache)
- Deleted files (in HEAD but not working)

## Design Decisions

### 1. Server-Side Rendering with Client-Side React

**Decision**: Use Pug for initial HTML, React for dynamic UI

**Rationale**:

- Fast initial page load
- SEO-friendly (though not critical for educational tool)
- React provides reactive UI updates
- No complex build pipeline needed

**Alternative Considered**: Full SPA with client-side routing

**Why Not**: Adds complexity without significant benefit for this use case

### 2. REST API Design

**Decision**: Resource-based API with hypermedia hints

**Rationale**:

- Intuitive URL structure (`/api/commits/:id`, `/api/trees/:id`)
- Easy to explore via browser or curl
- Models Git's content-addressable storage

**Alternative Considered**: GraphQL

**Why Not**: Overkill for simple read-only operations

### 3. No Build Step for Frontend

**Decision**: Load React from CDN, write JSX in separate files

**Rationale**:

- Simplifies development setup
- No webpack/babel configuration
- Quick iteration during development

**Alternative Considered**: Bundled frontend with webpack

**Why Not**: Adds build complexity; not worth it for small frontend

### 4. Configuration via File

**Decision**: Use `config.js` for repository path

**Rationale**:

- Simple for local development
- Explicit (no environment variable hunting)
- Git-ignorable (different per developer)

**Alternative Considered**: Environment variables only

**Why Not**: Less discoverable for new developers

## Future Considerations

### Scalability

Current architecture assumes:

- Single repository per instance
- Small to medium-sized repositories
- Local filesystem access

For larger scale:

- Add caching layer (Redis) for expensive git operations
- Implement pagination for large file lists
- Add repository switching without restart

### Features

Potential enhancements:

- Real-time updates via WebSockets
- Diff viewer with syntax highlighting
- Branch visualization and comparison
- Support for multiple repositories
- Git operation execution from UI (commits, branches, etc.)

### Testing

Current gaps:

- No integration tests for API endpoints
- No unit tests for git operations
- No frontend tests

Recommended:

- Jest integration tests with Supertest
- Unit tests for `lib/git.js` with mocked git commands
- React Testing Library for frontend components

### Security

Current state: Educational tool, not production-ready

Before production use:

- Input validation and sanitization
- Rate limiting
- Authentication/authorization
- Prevent directory traversal attacks
- Sandbox git operations

## Contributing

When modifying the architecture:

1. Update this document with rationale
2. Consider backward compatibility
3. Add tests for new components
4. Update CLAUDE.md if AI context changes

## References

- [Git Internals Documentation](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [simple-git Documentation](https://www.npmjs.com/package/simple-git)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Without JSX](https://reactjs.org/docs/react-without-jsx.html)
