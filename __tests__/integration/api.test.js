const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Setup paths
const testRepoPath = path.join(__dirname, '../..', 'test-repo');
const configPath = path.join(__dirname, '../..', 'config.js');

// Clean up and create test repo
function setupTestRepo() {
  // Remove if exists
  if (fs.existsSync(testRepoPath)) {
    fs.rmSync(testRepoPath, { recursive: true, force: true });
  }

  // Create test repository
  fs.mkdirSync(testRepoPath, { recursive: true });

  // Initialize git repo
  execSync('git init', { cwd: testRepoPath });
  execSync('git config user.name "Test User"', { cwd: testRepoPath });
  execSync('git config user.email "test@example.com"', { cwd: testRepoPath });

  // Create initial commit
  fs.writeFileSync(path.join(testRepoPath, 'README.md'), '# Test Repo\n');
  execSync('git add README.md', { cwd: testRepoPath });
  execSync('git commit -m "Initial commit"', { cwd: testRepoPath });

  // Create a test file
  fs.writeFileSync(path.join(testRepoPath, 'test.js'), 'console.log("test");\n');
  execSync('git add test.js', { cwd: testRepoPath });
  execSync('git commit -m "Add test.js"', { cwd: testRepoPath });
}

function cleanupTestRepo() {
  if (fs.existsSync(testRepoPath)) {
    fs.rmSync(testRepoPath, { recursive: true, force: true });
  }
}

// IMPORTANT: Setup test repo and config BEFORE loading app
setupTestRepo();
fs.writeFileSync(
  configPath,
  `module.exports = { repo: '${testRepoPath.replace(/\\/g, '/')}' };\n`
);

// NOW load dependencies that need config
const request = require('supertest');
const app = require('../../app');

// Cleanup after all tests
afterAll(() => {
  cleanupTestRepo();
});

describe('API Integration Tests', () => {
  describe('GET /api/status', () => {
    it('should return status information', async () => {
      const response = await request(app).get('/api/status').expect('Content-Type', /json/).expect(200);

      expect(response.body).toHaveProperty('files');
      expect(Array.isArray(response.body.files)).toBe(true);
    });

    it('should detect files in working copy, cache, and tree', async () => {
      const response = await request(app).get('/api/status').expect(200);

      const readmeFile = response.body.files.find((f) => f.fileName === 'README.md');
      expect(readmeFile).toBeDefined();
      expect(readmeFile.isInTree).toBe(true);
      expect(readmeFile.isInCache).toBe(true);
      expect(readmeFile.isInWorkingCopy).toBe(true);
    });
  });

  describe('GET /api/references', () => {
    it('should return git references', async () => {
      const response = await request(app)
        .get('/api/references')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('references');
      expect(Array.isArray(response.body.references)).toBe(true);
      expect(response.body.references.length).toBeGreaterThan(0);
    });

    it('should include HEAD reference', async () => {
      const response = await request(app).get('/api/references').expect(200);

      const headRef = response.body.references.find((ref) => ref.name === 'HEAD');
      expect(headRef).toBeDefined();
    });

    it('should include main/master branch', async () => {
      const response = await request(app).get('/api/references').expect(200);

      const hasBranch = response.body.references.some(
        (ref) => ref.name === 'refs/heads/main' || ref.name === 'refs/heads/master'
      );
      expect(hasBranch).toBe(true);
    });
  });

  describe('GET /api/HEAD/entries/:name', () => {
    it('should return file content from HEAD', async () => {
      const response = await request(app)
        .get('/api/HEAD/entries/README.md')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('name', 'README.md');
      expect(response.body.content).toContain('# Test Repo');
    });

    it('should return file content for test.js', async () => {
      const response = await request(app).get('/api/HEAD/entries/test.js').expect(200);

      expect(response.body.content).toContain('console.log');
    });
  });

  describe('GET /api/workingCopy/entries/:name', () => {
    it('should return file content from working copy', async () => {
      const response = await request(app)
        .get('/api/workingCopy/entries/README.md')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('name', 'README.md');
    });
  });

  describe('GET /api/cache/entries/:name', () => {
    it('should return file content from cache', async () => {
      const response = await request(app)
        .get('/api/cache/entries/README.md')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('content');
      expect(response.body).toHaveProperty('name', 'README.md');
    });
  });

  describe('Git Objects Endpoints', () => {
    let commitId;

    beforeAll(async () => {
      // Get a commit ID from references
      const response = await request(app).get('/api/references');
      const mainBranch = response.body.references.find(
        (ref) => ref.name === 'refs/heads/main' || ref.name === 'refs/heads/master'
      );
      commitId = mainBranch.commit;
    });

    describe('GET /api/commits/:commitId', () => {
      it('should return commit details', async () => {
        const response = await request(app)
          .get(`/api/commits/${commitId}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('type', 'commit');
        expect(response.body).toHaveProperty('tree');
        expect(response.body).toHaveProperty('message');
      });
    });

    describe('GET /api/trees/:treeId', () => {
      it('should return tree details', async () => {
        // First get commit to get tree ID
        const commitResponse = await request(app).get(`/api/commits/${commitId}`);
        const treeId = commitResponse.body.tree;

        const response = await request(app)
          .get(`/api/trees/${treeId}`)
          .expect('Content-Type', /json/)
          .expect(200);

        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('type', 'tree');
        expect(response.body).toHaveProperty('entries');
        expect(Array.isArray(response.body.entries)).toBe(true);
      });
    });

    describe('GET /api/blobs/:blobId', () => {
      it('should return blob details', async () => {
        // Get commit, then tree, then blob
        const commitResponse = await request(app).get(`/api/commits/${commitId}`);
        const treeId = commitResponse.body.tree;

        const treeResponse = await request(app).get(`/api/trees/${treeId}`);
        const blobEntry = treeResponse.body.entries.find((e) => e.type === 'blob');

        if (blobEntry) {
          const response = await request(app)
            .get(`/api/blobs/${blobEntry.id}`)
            .expect('Content-Type', /json/)
            .expect(200);

          expect(response.body).toHaveProperty('id');
          expect(response.body).toHaveProperty('type', 'blob');
          expect(response.body).toHaveProperty('content');
        }
      });
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent file in HEAD', async () => {
      await request(app).get('/api/HEAD/entries/nonexistent.txt').expect(404);
    });
  });
});
