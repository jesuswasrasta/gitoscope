const path = require('path');
const fs = require('fs');
const { execSync } = require('child_process');

// Setup test repository
const testRepoPath = path.join(__dirname, '../..', 'test-repo-unit');
const configPath = path.join(__dirname, '../..', 'config.js');

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
  fs.writeFileSync(path.join(testRepoPath, 'README.md'), '# Test\n');
  execSync('git add README.md', { cwd: testRepoPath });
  execSync('git commit -m "Initial commit"', { cwd: testRepoPath });
}

function cleanupTestRepo() {
  if (fs.existsSync(testRepoPath)) {
    fs.rmSync(testRepoPath, { recursive: true, force: true });
  }
}

// IMPORTANT: Setup BEFORE loading git module
setupTestRepo();
fs.writeFileSync(
  configPath,
  `module.exports = { repo: '${testRepoPath.replace(/\\/g, '/')}' };\n`
);

// NOW load git module
const git = require('../../lib/git');

afterAll(() => {
  cleanupTestRepo();
});

describe('Git Operations Unit Tests', () => {
  describe('getRepo()', () => {
    it('should return a simple-git instance', () => {
      const repo = git.getRepo();
      expect(repo).toBeDefined();
      expect(typeof repo.status).toBe('function');
    });
  });

  describe('getStatus()', () => {
    it('should return status object with files array', async () => {
      const status = await git.getStatus();

      expect(status).toHaveProperty('files');
      expect(Array.isArray(status.files)).toBe(true);
    });

    it('should detect committed files as in tree, cache, and working copy', async () => {
      const status = await git.getStatus();
      const readme = status.files.find((f) => f.fileName === 'README.md');

      expect(readme).toBeDefined();
      expect(readme.isInTree).toBe(true);
      expect(readme.isInCache).toBe(true);
      expect(readme.isInWorkingCopy).toBe(true);
    });

    it('should detect modified files', async () => {
      // Modify a file
      fs.writeFileSync(path.join(testRepoPath, 'README.md'), '# Modified Test\n');

      const status = await git.getStatus();
      const readme = status.files.find((f) => f.fileName === 'README.md');

      expect(readme.diffString).toBe('modified');

      // Restore
      execSync('git checkout README.md', { cwd: testRepoPath });
    });

    it('should detect new files in working copy', async () => {
      // Create a new file
      fs.writeFileSync(path.join(testRepoPath, 'new-file.txt'), 'New content\n');

      const status = await git.getStatus();
      const newFile = status.files.find((f) => f.fileName === 'new-file.txt');

      expect(newFile).toBeDefined();
      expect(newFile.isInWorkingCopy).toBe(true);
      expect(newFile.isInCache).toBe(false);
      expect(newFile.isInTree).toBe(false);

      // Cleanup
      fs.unlinkSync(path.join(testRepoPath, 'new-file.txt'));
    });

    it('should detect staged files', async () => {
      // Create and stage a file
      fs.writeFileSync(path.join(testRepoPath, 'staged.txt'), 'Staged content\n');
      execSync('git add staged.txt', { cwd: testRepoPath });

      const status = await git.getStatus();
      const stagedFile = status.files.find((f) => f.fileName === 'staged.txt');

      expect(stagedFile).toBeDefined();
      expect(stagedFile.isInCache).toBe(true);
      expect(stagedFile.diffCachedString).toBe('added');

      // Cleanup
      execSync('git reset HEAD staged.txt', { cwd: testRepoPath });
      fs.unlinkSync(path.join(testRepoPath, 'staged.txt'));
    });
  });

  describe('getListOfFilesInHeadCommit()', () => {
    it('should return array of files in HEAD', async () => {
      const files = await git.getListOfFilesInHeadCommit();

      expect(Array.isArray(files)).toBe(true);
      expect(files.length).toBeGreaterThan(0);
      expect(files).toContain('README.md');
    });
  });

  describe('getTreeContent()', () => {
    it('should return file content from HEAD', async () => {
      const result = await git.getTreeContent('README.md');

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('name', 'README.md');
    });
  });

  describe('getWorkingCopyContent()', () => {
    it('should return file content from working directory', async () => {
      const result = await git.getWorkingCopyContent('README.md');

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('name', 'README.md');
    });
  });

  describe('getCacheContent()', () => {
    it('should return file content from staging area', async () => {
      const result = await git.getCacheContent('README.md');

      expect(result).toHaveProperty('content');
      expect(result).toHaveProperty('name', 'README.md');
    });
  });

  describe('getReferences()', () => {
    it('should return references object', async () => {
      const refs = await git.getReferences();

      expect(refs).toHaveProperty('references');
      expect(Array.isArray(refs.references)).toBe(true);
    });

    it('should include HEAD reference', async () => {
      const refs = await git.getReferences();
      const head = refs.references.find((r) => r.name === 'HEAD');

      expect(head).toBeDefined();
    });

    it('should include branch references', async () => {
      const refs = await git.getReferences();
      const hasBranch = refs.references.some((r) => r.name.startsWith('refs/heads/'));

      expect(hasBranch).toBe(true);
    });
  });

  describe('getCommit()', () => {
    it('should return commit object with metadata', async () => {
      // Get HEAD commit ID
      const refs = await git.getReferences();
      const head = refs.references.find((r) => r.name === 'HEAD');
      const commitId = head.commit;

      const commit = await git.getCommit(commitId);

      expect(commit).toHaveProperty('id');
      expect(commit).toHaveProperty('type', 'commit');
      expect(commit).toHaveProperty('tree');
      expect(commit).toHaveProperty('message');
      expect(commit.message).toContain('Initial commit');
    });
  });

  describe('getTreeRest()', () => {
    it('should return tree object with entries', async () => {
      // Get HEAD commit to get tree ID
      const refs = await git.getReferences();
      const head = refs.references.find((r) => r.name === 'HEAD');
      const commit = await git.getCommit(head.commit);
      const treeId = commit.tree;

      const tree = await git.getTreeRest(treeId);

      expect(tree).toHaveProperty('id');
      expect(tree).toHaveProperty('type', 'tree');
      expect(tree).toHaveProperty('entries');
      expect(Array.isArray(tree.entries)).toBe(true);
      expect(tree.entries.length).toBeGreaterThan(0);
    });
  });

  describe('getBlobRest()', () => {
    it('should return blob object with content', async () => {
      // Get HEAD commit, then tree, then first blob
      const refs = await git.getReferences();
      const head = refs.references.find((r) => r.name === 'HEAD');
      const commit = await git.getCommit(head.commit);
      const tree = await git.getTreeRest(commit.tree);
      const blob = tree.entries.find((e) => e.type === 'blob');

      if (blob) {
        const blobData = await git.getBlobRest(blob.id);

        expect(blobData).toHaveProperty('id');
        expect(blobData).toHaveProperty('type', 'blob');
        expect(blobData).toHaveProperty('content');
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commit ID', async () => {
      await expect(git.getCommit('invalid-commit-id')).rejects.toThrow();
    });

    it('should handle non-existent file in HEAD', async () => {
      await expect(git.getTreeContent('nonexistent.txt')).rejects.toThrow();
    });

    it('should handle invalid tree ID', async () => {
      await expect(git.getTreeRest('invalid-tree-id')).rejects.toThrow();
    });

    it('should handle invalid blob ID', async () => {
      await expect(git.getBlobRest('invalid-blob-id')).rejects.toThrow();
    });
  });
});
