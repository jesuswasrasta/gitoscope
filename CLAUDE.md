# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Gitoscope is an educational tool that visualizes Git internals. It provides a web interface showing the working copy, staging area, HEAD commit, and internal storage (commits, trees, blobs) with graphical representations.

## Tech Stack

- **Backend**: Node.js with Express.js
- **Git Integration**: NodeGit (libgit2 Node.js bindings)
- **Templates**: Pug view engine
- **Frontend**: React client (in public/javascripts/reactClient.js)

## Development Commands

### Setup

```bash
# Copy config template and set repository path
cp config.js.template config.js
# Edit config.js to set the 'repo' path to your test repository

# Install dependencies
npm install
```

### Running the Application

```bash
# Start server (production mode, port 3000)
npm run start

# Development mode with auto-reload
npm run watch

# Development mode with debugging and auto-reload
npm run watchd

# Debug mode
npm run debug
```

The application runs on `http://localhost:3000` by default. Port can be changed via `PORT` environment variable.

### Docker

```bash
# Run with internal repository
docker container run --name gitoscope -p 8080:3000 depsir/gitoscope

# Run with external repository (mount local repo)
docker container run --name gitoscope -p 8080:3000 -v /path/to/repo:/repo depsir/gitoscope
```

## Architecture

### Core Components

**Configuration** (`config.js`)

- Required before running the application (created from `config.js.template`)
- Specifies the path to the Git repository to visualize
- Application exits with error message if config.js is missing

**Git Operations Layer** (`lib/git.js`)

- Central module for all Git operations using NodeGit
- Opens repository via `getRepo()` which returns a nodegit Repository object
- Key functions:
  - `getStatus()` - Returns comprehensive file status across working copy, staging area, and HEAD
  - `getListOfFilesInHeadCommit()` - Lists all files in HEAD commit
  - `getFile(entry)` - Retrieves file content from HEAD commit
  - `getWorkingCopyContent(resource)` - Gets file content from working directory
  - `getCacheContent(resource)` - Gets file content from staging area
  - `getCommit(commitId)`, `getTreeRest(treeId)`, `getBlobRest(blobId)` - Retrieve Git objects
  - `getReferences()` - Lists all refs (branches, tags) plus HEAD
- Diff operations use nodegit's `Diff.treeToIndex` and `Diff.treeToWorkdir`
- Status building logic distinguishes between working copy, cache (staging), and tree (HEAD) states

**Data Models** (`lib/gitModels.js`)

- Factory functions that transform NodeGit objects into REST API responses
- `commitFactory()` - Converts commits with parent links and tree references
- `treeFactory()` - Converts tree objects with entry lists
- `blobFactory()` - Converts blob objects with content and size
- `referenceFactory()` - Converts Git references (branches, tags, HEAD)
- Generates REST URLs for navigation (e.g., `/trees/:id`, `/blobs/:id`, `/commits/:id`)

**API Layer**

- `controllers/apiController.js` - Controller functions wrapping git lib operations
- `routes/api.js` - API route definitions:
  - `/api/status` - File status information
  - `/api/HEAD/entries/:name` - File content from HEAD
  - `/api/workingCopy/entries/:name` - Working copy file content
  - `/api/cache/entries/:name` - Staging area file content
  - `/api/commits/:commitId` - Commit object details
  - `/api/trees/:treeId` - Tree object details
  - `/api/blobs/:blobId` - Blob object details
  - `/api/references` - All Git references

**Views and Frontend**

- `routes/index.js` - Serves main views (index and internals pages)
- `views/*.pug` - Pug templates for rendering pages
- `public/javascripts/reactClient.js` - React-based frontend for interactive visualization
- `public/javascripts/internals.js` - Visualization for Git internals
- `public/javascripts/cytoscape-dagre.js` - Graph visualization library

### Application Flow

1. On startup, `app.js` loads `config.js` to get the repository path
2. Express server starts via `bin/www` (default port 3000)
3. Frontend makes API calls to retrieve repository state
4. `lib/git.js` uses NodeGit to read from the configured repository
5. Data models transform Git objects to JSON responses
6. React client renders the working copy, staging area, HEAD, and Git object graph

## Key Implementation Details

- **Status Calculation**: The status logic (lib/git.js:93-145) tracks three states per file:
  - `isInWorkingCopy` - File exists in working directory
  - `isInCache` - File exists in staging area
  - `isInTree` - File exists in HEAD commit
  - Plus `diffString` and `diffCachedString` for change indicators

- **Diff Application**: When showing working copy or cache content, diffs are applied to HEAD content using `applyDiffLines()` which splices diff hunks into the base content

- **NodeGit Promises**: All NodeGit operations return Promises; the codebase uses Promise chains and `Promise.all()` for concurrent operations

- **Repository Access**: The repository path is configured once at startup. Changing repos requires restarting the application with a new config.js

## Dependencies Notes

- **nodegit**: Requires native compilation (uses libgit2). Docker image includes build dependencies (python, build-base, libgit2-dev)
- **Node version**: Currently uses Node 12 (see Dockerfile). May need updates for newer Node versions
- No test framework is currently set up in this project
