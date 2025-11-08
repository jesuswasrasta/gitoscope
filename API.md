# Gitoscope REST API Documentation

This document describes all REST API endpoints provided by Gitoscope.

## Base URL

```
http://localhost:3000/api
```

(Port configurable via `PORT` environment variable)

## Table of Contents

- [Status Endpoints](#status-endpoints)
- [Content Endpoints](#content-endpoints)
- [Git Objects Endpoints](#git-objects-endpoints)
- [Reference Endpoints](#reference-endpoints)
- [Error Handling](#error-handling)
- [Examples](#examples)

## Status Endpoints

### Get Repository Status

Returns comprehensive file status information across working copy, staging area (cache), and HEAD commit.

**Endpoint**: `GET /api/status`

**Response**:

```json
{
  "files": [
    {
      "fileName": "example.js",
      "isInWorkingCopy": true,
      "isInCache": true,
      "isInTree": true,
      "diffString": "modified",
      "diffCachedString": ""
    }
  ]
}
```

**Field Descriptions**:

- `fileName` (string): Name of the file
- `isInWorkingCopy` (boolean): File exists in working directory
- `isInCache` (boolean): File exists in staging area
- `isInTree` (boolean): File exists in HEAD commit
- `diffString` (string): Status between working copy and cache
  - `"added"`: New file in working copy
  - `"modified"`: File changed in working copy
  - `"deleted"`: File removed from working copy
  - `""`: No changes
- `diffCachedString` (string): Status between cache and HEAD
  - `"added"`: New file staged for commit
  - `"modified"`: Modified file staged
  - `"deleted"`: File deletion staged
  - `""`: No changes

**Example Request**:

```bash
curl http://localhost:3000/api/status
```

**Use Cases**:

- Display working copy state
- Show staged changes
- Compare current state with HEAD

---

## Content Endpoints

These endpoints retrieve file content from different areas of the repository.

### Get File from HEAD

Returns file content from the HEAD commit.

**Endpoint**: `GET /api/HEAD/entries/:name`

**Parameters**:

- `name` (path parameter): File name (must match `[\w.]+`)

**Response**:

```json
{
  "content": "file contents here...",
  "name": "example.js"
}
```

**Example Request**:

```bash
curl http://localhost:3000/api/HEAD/entries/example.js
```

---

### Get File from Working Copy

Returns file content from the working directory.

**Endpoint**: `GET /api/workingCopy/entries/:name`

**Parameters**:

- `name` (path parameter): File name (must match `[\w.]+`)

**Response**:

```json
{
  "content": "current file contents...",
  "name": "example.js"
}
```

**Example Request**:

```bash
curl http://localhost:3000/api/workingCopy/entries/example.js
```

---

### Get File from Staging Area

Returns file content from the staging area (index/cache).

**Endpoint**: `GET /api/cache/entries/:name`

**Parameters**:

- `name` (path parameter): File name (must match `[\w.]+`)

**Response**:

```json
{
  "content": "staged file contents...",
  "name": "example.js"
}
```

**Example Request**:

```bash
curl http://localhost:3000/api/cache/entries/example.js
```

---

## Git Objects Endpoints

These endpoints provide access to Git's internal object database.

### Get Commit Object

Returns details of a specific commit.

**Endpoint**: `GET /api/commits/:commitId`

**Parameters**:

- `commitId` (path parameter): SHA-1 hash of the commit (must match `\w+`)

**Response**:

```json
{
  "id": "a1b2c3d4e5f6...",
  "type": "commit",
  "tree": "tree123...",
  "treeUrl": "/api/trees/tree123...",
  "parents": [
    {
      "id": "parent123...",
      "url": "/api/commits/parent123..."
    }
  ],
  "author": "John Doe <john@example.com>",
  "committer": "John Doe <john@example.com>",
  "message": "Commit message here",
  "timestamp": "2025-11-08T12:00:00Z"
}
```

**Field Descriptions**:

- `id`: SHA-1 hash of the commit
- `type`: Always "commit"
- `tree`: SHA-1 hash of the root tree object
- `treeUrl`: REST URL to fetch the tree object
- `parents`: Array of parent commit references
- `author`: Author name and email
- `committer`: Committer name and email
- `message`: Commit message
- `timestamp`: Commit timestamp (ISO 8601)

**Example Request**:

```bash
curl http://localhost:3000/api/commits/a1b2c3d4e5f6
```

**Use Cases**:

- Display commit history
- Show commit details
- Navigate commit graph

---

### Get Tree Object

Returns a tree object and its entries (files and subdirectories).

**Endpoint**: `GET /api/trees/:treeId`

**Parameters**:

- `treeId` (path parameter): SHA-1 hash of the tree (must match `\w+`)

**Response**:

```json
{
  "id": "tree123...",
  "type": "tree",
  "entries": [
    {
      "mode": "100644",
      "type": "blob",
      "id": "blob456...",
      "name": "file.js",
      "url": "/api/blobs/blob456..."
    },
    {
      "mode": "040000",
      "type": "tree",
      "id": "subtree789...",
      "name": "subdir",
      "url": "/api/trees/subtree789..."
    }
  ]
}
```

**Field Descriptions**:

- `id`: SHA-1 hash of the tree
- `type`: Always "tree"
- `entries`: Array of tree entries
  - `mode`: Git file mode (100644 = regular file, 040000 = directory, 100755 = executable)
  - `type`: Entry type ("blob" or "tree")
  - `id`: SHA-1 hash of the entry
  - `name`: File or directory name
  - `url`: REST URL to fetch the entry

**Example Request**:

```bash
curl http://localhost:3000/api/trees/tree123
```

**Use Cases**:

- Browse repository structure
- Display directory contents
- Navigate file hierarchy

---

### Get Blob Object

Returns a blob object (file content).

**Endpoint**: `GET /api/blobs/:blobId`

**Parameters**:

- `blobId` (path parameter): SHA-1 hash of the blob (must match `\w+`)

**Response**:

```json
{
  "id": "blob456...",
  "type": "blob",
  "content": "file contents here...",
  "size": 1234
}
```

**Field Descriptions**:

- `id`: SHA-1 hash of the blob
- `type`: Always "blob"
- `content`: File content (text or base64 for binary)
- `size`: Size in bytes

**Example Request**:

```bash
curl http://localhost:3000/api/blobs/blob456
```

**Use Cases**:

- Display file contents
- Download files from Git object database
- Compare object contents

---

## Reference Endpoints

### Get All References

Returns all Git references (branches, tags, HEAD).

**Endpoint**: `GET /api/references`

**Response**:

```json
{
  "references": [
    {
      "name": "HEAD",
      "type": "symbolic",
      "target": "refs/heads/main",
      "commit": "a1b2c3d4e5f6..."
    },
    {
      "name": "refs/heads/main",
      "type": "direct",
      "commit": "a1b2c3d4e5f6...",
      "url": "/api/commits/a1b2c3d4e5f6..."
    },
    {
      "name": "refs/heads/feature-branch",
      "type": "direct",
      "commit": "b2c3d4e5f6a1...",
      "url": "/api/commits/b2c3d4e5f6a1..."
    },
    {
      "name": "refs/tags/v1.0.0",
      "type": "direct",
      "commit": "c3d4e5f6a1b2...",
      "url": "/api/commits/c3d4e5f6a1b2..."
    }
  ]
}
```

**Field Descriptions**:

- `name`: Reference name (e.g., "HEAD", "refs/heads/main")
- `type`: Reference type
  - `"symbolic"`: Points to another reference (like HEAD)
  - `"direct"`: Points directly to a commit
- `target`: For symbolic refs, the reference it points to
- `commit`: SHA-1 hash of the commit
- `url`: REST URL to fetch the commit

**Example Request**:

```bash
curl http://localhost:3000/api/references
```

**Use Cases**:

- List branches
- Show tags
- Display current HEAD
- Build branch selector UI

---

## Error Handling

All endpoints follow standard HTTP status codes and return JSON error responses.

### Error Response Format

```json
{
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE",
    "details": {}
  }
}
```

### Common HTTP Status Codes

- `200 OK`: Successful request
- `404 Not Found`: Resource not found (commit, tree, blob, or file)
- `400 Bad Request`: Invalid parameters
- `500 Internal Server Error`: Server-side error (e.g., git command failed)

### Example Error Responses

**File not found in HEAD**:

```http
HTTP/1.1 404 Not Found
Content-Type: application/json

{
  "error": {
    "message": "File not found in HEAD commit",
    "code": "FILE_NOT_FOUND"
  }
}
```

**Invalid commit ID**:

```http
HTTP/1.1 400 Bad Request
Content-Type: application/json

{
  "error": {
    "message": "Invalid commit ID format",
    "code": "INVALID_COMMIT_ID"
  }
}
```

---

## Examples

### Complete Workflow: Exploring a Commit

1. **Get all references to find commits**:

   ```bash
   curl http://localhost:3000/api/references
   ```

2. **Get commit details**:

   ```bash
   curl http://localhost:3000/api/commits/a1b2c3d4e5f6
   ```

3. **Get the commit's root tree**:

   ```bash
   curl http://localhost:3000/api/trees/tree123
   ```

4. **Get a specific file blob**:

   ```bash
   curl http://localhost:3000/api/blobs/blob456
   ```

### Checking File Status

1. **Get repository status**:

   ```bash
   curl http://localhost:3000/api/status
   ```

2. **Compare working copy with HEAD**:

   ```bash
   # Get from working copy
   curl http://localhost:3000/api/workingCopy/entries/example.js

   # Get from HEAD
   curl http://localhost:3000/api/HEAD/entries/example.js
   ```

3. **Check staged version**:
   ```bash
   curl http://localhost:3000/api/cache/entries/example.js
   ```

### Using with `jq` for Pretty Output

```bash
# Pretty-print status
curl -s http://localhost:3000/api/status | jq '.'

# Get only file names from status
curl -s http://localhost:3000/api/status | jq '.files[].fileName'

# List all branches
curl -s http://localhost:3000/api/references | jq '.references[] | select(.name | startswith("refs/heads/"))'
```

---

## Rate Limiting

Currently, there is **no rate limiting** implemented. This is an educational tool meant for local development.

**Future Consideration**: Add rate limiting before exposing to untrusted networks.

---

## Authentication

Currently, there is **no authentication** required.

**Security Note**: This tool is designed for local, trusted environments. Do not expose to public networks without adding authentication and authorization.

---

## CORS

CORS is **not configured**. The API is intended to be accessed by the frontend served from the same origin.

---

## Content Negotiation

All endpoints return `Content-Type: application/json`.

There is no support for other content types (XML, YAML, etc.).

---

## Versioning

The API is currently **unversioned**. All endpoints are at the root `/api` path.

**Future Consideration**: Add versioning (e.g., `/api/v1/`) before making breaking changes.

---

## Testing the API

### Using curl

```bash
# Test status endpoint
curl -i http://localhost:3000/api/status

# Test with verbose output
curl -v http://localhost:3000/api/references
```

### Using HTTPie

```bash
# Install HTTPie: pip install httpie
http GET localhost:3000/api/status
```

### Using Postman

Import this base URL: `http://localhost:3000/api`

Create requests for each endpoint documented above.

### Automated Testing

See test files in `__tests__/` directory for Jest/Supertest integration tests.

Run tests:

```bash
npm test
```

---

## Support

For issues or questions:

- Check [ARCHITECTURE.md](./ARCHITECTURE.md) for implementation details
- Review [CLAUDE.md](./CLAUDE.md) for AI assistant context
- Open an issue on GitHub

---

**Last Updated**: 2025-11-08
**API Version**: Unversioned (initial release)
