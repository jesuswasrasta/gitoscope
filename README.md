# Gitoscope

> An educational tool to visualize and understand Git internals

Gitoscope provides an interactive web interface for exploring how Git manages files, commits, trees, and blobs. Perfect for learning Git's internal object model and understanding the relationship between the working copy, staging area, and HEAD commit.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D22.0.0-brightgreen.svg)
![Docker](https://img.shields.io/badge/docker-ready-blue.svg)

---

## Table of Contents

- [Features](#features)
- [Quick Start with Docker](#quick-start-with-docker)
- [Using Gitoscope](#using-gitoscope)
- [Docker Configuration](#docker-configuration)
- [Local Development Setup](#local-development-setup)
- [Available Scripts](#available-scripts)
- [Troubleshooting](#troubleshooting)
- [Documentation](#documentation)
- [Contributing](#contributing)

---

## Features

- **Working Copy Visualization**: See your current file system state in real-time
- **Staging Area View**: Understand what's staged for the next commit
- **HEAD Commit Details**: Explore the current commit contents
- **Git Internals Graph**: Visual representation of commits, trees, and blobs
- **Real-time Updates**: Changes to the repository immediately visible in the UI
- **Interactive Exploration**: Click through Git objects to understand relationships
- **Educational Focus**: Designed specifically for learning Git internals

---

## Quick Start with Docker

The easiest way to run Gitoscope is using Docker. No Node.js installation required!

### Option 1: Using the Built-in Repository (For Learning)

Perfect for exploring Git internals without affecting your own repositories.

```bash
docker run --name gitoscope -p 8080:3000 depsir/gitoscope
```

**Then open your browser at:** http://localhost:8080

The container includes an empty Git repository at `/repo` inside the container. You can manipulate this repository to see how Gitoscope visualizes changes.

#### Making Changes to the Internal Repository

Enter the container to manipulate the repository:

```bash
# Open a shell inside the container
docker exec -it gitoscope /bin/sh

# Navigate to the repository
cd /repo

# Make some changes
echo "Hello Git!" > hello.txt
git add hello.txt
git commit -m "Add hello.txt"

# Refresh the browser to see the changes
```

**Exit the container shell**: Type `exit` or press `Ctrl+D`

### Option 2: Using Your Own Repository (Recommended)

Mount your local Git repository to visualize it with Gitoscope.

#### Using an Absolute Path

```bash
docker run --name gitoscope -p 8080:3000 -v /absolute/path/to/your/repo:/repo depsir/gitoscope
```

**Example (Linux/Mac):**
```bash
docker run --name gitoscope -p 8080:3000 -v /home/user/projects/my-repo:/repo depsir/gitoscope
```

**Example (Windows with WSL):**
```bash
docker run --name gitoscope -p 8080:3000 -v /c/Users/YourName/projects/my-repo:/repo depsir/gitoscope
```

#### Using the Current Directory

If you're already inside a Git repository:

**Linux/Mac:**
```bash
docker run --name gitoscope -p 8080:3000 -v "$(pwd)":/repo depsir/gitoscope
```

**Windows PowerShell:**
```powershell
docker run --name gitoscope -p 8080:3000 -v ${PWD}:/repo depsir/gitoscope
```

**Windows CMD:**
```cmd
docker run --name gitoscope -p 8080:3000 -v %cd%:/repo depsir/gitoscope
```

**Then open your browser at:** http://localhost:8080

### Stopping and Restarting the Container

```bash
# Stop the container
docker stop gitoscope

# Start it again
docker start gitoscope

# Remove the container (when you're done)
docker rm -f gitoscope
```

### Building Your Own Docker Image

If you've cloned the repository and want to build locally:

```bash
# Clone the repository
git clone https://github.com/intresrl/gitoscope.git
cd gitoscope

# Build the Docker image
docker build -t my-gitoscope .

# Run your custom image
docker run --name gitoscope -p 8080:3000 -v "$(pwd)":/repo my-gitoscope
```

---

## Using Gitoscope

Gitoscope provides two main views to help you understand Git internals.

### Main View (Index Page)

**URL:** http://localhost:8080 (or http://localhost:8080/ or http://localhost:8080/index)

This is the primary view showing the **three areas** of Git:

#### 1. Working Copy (Left Column)
Shows all files currently in your working directory.
- **Green files**: Tracked and committed
- **Modified files**: Changed since last commit
- **Untracked files**: New files not yet added to Git

#### 2. Staging Area / Index / Cache (Middle Column)
Shows files staged for the next commit (via `git add`).
- Files here will be included in your next commit
- Also called the "Index" or "Cache" in Git terminology

#### 3. HEAD Commit (Right Column)
Shows files as they exist in the current HEAD commit.
- This is the last committed state
- Click on files to see their content

#### How to Use the Main View

1. **View file status**: See which files are modified, staged, or committed
2. **Click on files**: View file contents from any of the three areas
3. **Compare states**: Understand the difference between working copy, staging, and HEAD
4. **Make changes**:
   - Modify files in your repository
   - Run `git add` to stage files
   - Run `git commit` to commit changes
   - Refresh the browser to see updates

**Example Workflow:**

```bash
# If using Docker with internal repo
docker exec -it gitoscope /bin/sh
cd /repo

# Create a new file
echo "console.log('Hello');" > app.js

# Refresh browser - you'll see app.js in Working Copy only

# Stage the file
git add app.js

# Refresh browser - you'll see app.js in Working Copy AND Staging Area

# Commit the file
git commit -m "Add app.js"

# Refresh browser - you'll see app.js in all three columns
```

### Internals View (Git Objects Graph)

**URL:** http://localhost:8080/internals

This view shows Git's internal object database as an interactive graph.

#### What You'll See

- **Commits** (yellow nodes): Commit objects with messages and metadata
- **Trees** (green nodes): Directory structures
- **Blobs** (blue nodes): File contents
- **References** (labels): Branches, tags, and HEAD pointer

#### Graph Elements

- **Nodes**: Each node represents a Git object
  - Click on a node to see its details
  - Hover to see object ID
- **Edges**: Lines connecting objects show relationships
  - Commit → Tree: The commit's root directory
  - Commit → Parent Commit: Commit history
  - Tree → Blob: Files in the tree
  - Tree → Tree: Subdirectories

#### How to Use the Internals View

1. **Select a reference**: Choose HEAD, a branch, or a tag from the dropdown
2. **Explore the graph**:
   - Click on commit nodes to see commit details
   - Click on tree nodes to see directory contents
   - Click on blob nodes to see file contents
3. **Understand relationships**: Follow edges to see how Git links objects
4. **Navigate history**: Click through parent commits to traverse history

**Understanding the Graph:**

```
HEAD → [Commit A] → [Tree] → [Blob: file.txt]
          ↓
       [Commit B] (parent)
          ↓
       [Commit C] (grandparent)
```

This shows:
- Current HEAD points to Commit A
- Commit A has a tree (root directory)
- Tree contains a blob (file)
- Commit A's parent is Commit B
- Commit history goes back to Commit C

---

## Docker Configuration

### Port Mapping

By default, Gitoscope runs on port 3000 inside the container. Map it to any port on your host:

```bash
# Map to host port 8080 (recommended)
docker run -p 8080:3000 ...

# Map to host port 3000
docker run -p 3000:3000 ...

# Map to host port 9000
docker run -p 9000:3000 ...
```

Then access at `http://localhost:<YOUR_PORT>`

### Volume Mounting

The repository must be mounted at `/repo` inside the container:

```bash
docker run -v <HOST_PATH>:/repo ...
```

**Important Notes:**
- The path must point to a Git repository (contains `.git` directory)
- The repository must be initialized (`git init` already run)
- Read/write permissions are required for the container to access files

### Running in Detached Mode

Run the container in the background:

```bash
docker run -d --name gitoscope -p 8080:3000 -v "$(pwd)":/repo depsir/gitoscope
```

The `-d` flag runs the container in detached mode.

View logs:
```bash
docker logs gitoscope

# Follow logs in real-time
docker logs -f gitoscope
```

### Environment Variables

Set custom environment variables:

```bash
# Use a different port inside the container
docker run -e PORT=8000 -p 8080:8000 ...

# Enable debug logging
docker run -e DEBUG=gitoscope:* ...
```

### Complete Docker Command Examples

**For learning (internal repo):**
```bash
docker run -d \
  --name gitoscope \
  -p 8080:3000 \
  --restart unless-stopped \
  depsir/gitoscope
```

**For visualizing your own repo:**
```bash
docker run -d \
  --name gitoscope \
  -p 8080:3000 \
  -v "$(pwd)":/repo \
  --restart unless-stopped \
  depsir/gitoscope
```

**With custom port and debug logging:**
```bash
docker run -d \
  --name gitoscope \
  -p 9000:3000 \
  -v "$(pwd)":/repo \
  -e DEBUG=gitoscope:* \
  depsir/gitoscope
```

---

## Local Development Setup

For contributing to Gitoscope or running without Docker:

### Requirements

- **Node.js**: >= 22.0.0
- **npm**: >= 10.0.0
- **Git**: Any recent version

### Installation Steps

1. **Clone the repository**

   ```bash
   git clone https://github.com/intresrl/gitoscope.git
   cd gitoscope
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Configure repository path**

   ```bash
   cp config.js.template config.js
   ```

   Edit `config.js` and set the `repo` path:

   ```javascript
   module.exports = {
     repo: '/absolute/path/to/your/git/repository',
   };
   ```

   **Important:** Use an absolute path, not a relative path.

4. **Start the application**

   ```bash
   npm start
   ```

5. **Open your browser**

   Navigate to http://localhost:3000

### Development Mode

Run with auto-reload on file changes:

```bash
npm run watch
```

Run with debugging and auto-reload:

```bash
npm run watchd
```

Debug mode (with Node.js inspector):

```bash
npm run debug
```

Then open Chrome DevTools at `chrome://inspect`

---

## Available Scripts

### Production

- `npm start` - Start the production server on port 3000

### Development

- `npm run watch` - Auto-reload on file changes (using nodemon)
- `npm run watchd` - Auto-reload with debugging enabled
- `npm run debug` - Debug mode with Node.js inspector

### Testing

- `npm test` - Run all tests with Jest
- `npm run test:watch` - Run tests in watch mode (re-run on changes)
- `npm run test:coverage` - Generate code coverage report

### Code Quality

- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Auto-fix ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting without modifying files

---

## Troubleshooting

### Docker Issues

#### Container Already Exists

**Error:** `The container name "/gitoscope" is already in use`

**Solution:**
```bash
# Remove the existing container
docker rm -f gitoscope

# Then run your docker run command again
```

#### Cannot Access Repository

**Error:** `fatal: not a git repository` or empty visualization

**Solution:**
- Ensure the mounted directory is a Git repository (contains `.git`)
- Check the volume mount path is correct
- Verify the repository is initialized: `git init`

**Check what's mounted:**
```bash
docker exec -it gitoscope ls -la /repo
```

#### Port Already in Use

**Error:** `bind: address already in use`

**Solution:**
- Use a different host port: `-p 9000:3000`
- Or stop the process using port 8080

**Find what's using the port (Linux/Mac):**
```bash
lsof -i :8080
```

### Application Issues

#### Empty Page or No Files Showing

**Causes:**
- Repository has no commits yet
- config.js points to wrong directory

**Solutions:**
```bash
# Make an initial commit if repository is empty
cd /path/to/repo
git add .
git commit -m "Initial commit"

# Verify config.js has correct path
cat config.js
```

#### Changes Not Reflecting

**Solution:** Refresh your browser (F5 or Ctrl+R)

Gitoscope doesn't auto-refresh - you need to manually refresh the page after making Git operations.

#### 404 Error on Internals Page

**Solution:** Make sure you're accessing the correct URL:
- Main view: http://localhost:8080/
- Internals: http://localhost:8080/internals

### Getting Help

If you encounter issues:

1. Check the application logs:
   ```bash
   # Docker
   docker logs gitoscope

   # Local
   # Logs appear in terminal
   ```

2. Check the [GitHub Issues](https://github.com/intresrl/gitoscope/issues)

3. Open a new issue with:
   - Your environment (Docker version, Node.js version, OS)
   - Steps to reproduce
   - Expected vs actual behavior
   - Logs or error messages

---

## Documentation

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture, design decisions, and implementation details
- **[API.md](./API.md)** - Complete REST API reference with examples
- **[CLAUDE.md](./CLAUDE.md)** - Development context for AI assistants

---

## Project Structure

```
gitoscope/
├── __tests__/           # Test suites (Jest)
│   ├── integration/     # API integration tests
│   └── unit/            # Unit tests
├── bin/                 # Server bootstrap
│   └── www              # Entry point
├── controllers/         # Request handlers
│   └── apiController.js # API route controllers
├── lib/                 # Core Git operations
│   ├── git.js           # Git operations using simple-git
│   └── gitModels.js     # Data models/factories
├── public/              # Frontend assets
│   ├── javascripts/     # React components & visualization
│   └── stylesheets/     # CSS files
├── routes/              # Express routes
│   ├── api.js           # API endpoints
│   └── index.js         # View routes
├── views/               # Pug templates
│   ├── index.pug        # Main view
│   └── internals.pug    # Internals view
├── app.js               # Express app configuration
├── config.js.template   # Configuration template
├── Dockerfile           # Multi-stage Docker build
└── package.json         # Dependencies and scripts
```

---

## Contributing

We welcome contributions! Here's how to get started:

### Development Workflow

1. **Fork the repository** on GitHub

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/gitoscope.git
   cd gitoscope
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/amazing-feature
   ```

4. **Make your changes**
   - Write clean, documented code
   - Follow existing code style
   - Add tests for new features

5. **Run quality checks**
   ```bash
   npm run lint        # Check code quality
   npm run format      # Format code
   npm test            # Run tests
   ```

6. **Commit your changes**

   Use [Conventional Commits](https://www.conventionalcommits.org/):
   ```bash
   git commit -m "feat: add amazing new feature"
   git commit -m "fix: resolve issue with status display"
   git commit -m "docs: update README with examples"
   ```

7. **Push to your fork**
   ```bash
   git push origin feature/amazing-feature
   ```

8. **Open a Pull Request** on GitHub

### Code Quality Standards

This project uses:
- **ESLint** for linting (eslint:recommended + Prettier)
- **Prettier** for code formatting
- **Jest** for testing
- **Conventional Commits** for commit messages

Before submitting a PR, ensure:
```bash
npm run lint        # No linting errors
npm run format      # Code is formatted
npm test            # All tests pass
```

### Testing Your Changes

Run the test suite:
```bash
npm test                 # Run all tests
npm run test:watch       # Watch mode
npm run test:coverage    # With coverage report
```

Test with Docker:
```bash
docker build -t gitoscope-test .
docker run -p 8080:3000 gitoscope-test
```

---

## Technology Stack

### Backend
- **Node.js 22+** - JavaScript runtime
- **Express.js 4.x** - Web framework
- **simple-git 3.x** - Git operations (wraps native git commands)
- **Pug 3.x** - Template engine

### Frontend
- **React** - UI components (loaded via CDN)
- **Cytoscape.js** - Graph visualization for internals view
- **Vanilla CSS** - Styling

### Development Tools
- **Jest** - Testing framework
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Nodemon** - Development auto-reload

---

## License

MIT License - see LICENSE file for details

---

## Authors

**Francesco Sacchi** - <sacchi@intre.it>

### Contributors

- Andrea Caglio - <caglio@intre.it>
- Gianni Bombelli (bombo82) - <bombo82@giannibombelli.it>

---

## Use Cases

### For Students Learning Git

```bash
# Start with an empty repository
docker run --name gitoscope -p 8080:3000 depsir/gitoscope

# Open browser at http://localhost:8080

# Make changes and see how Git tracks them
docker exec -it gitoscope /bin/sh
cd /repo
# ... make git operations ...
# Refresh browser to see changes
```

### For Teachers Demonstrating Git

Use Gitoscope during lectures to show:
- How files move from working copy → staging → commit
- How Git stores objects internally (commits, trees, blobs)
- The difference between branches and commits
- How merge commits create multiple parents

### For Developers Debugging Git Issues

```bash
# Visualize your problematic repository
cd /path/to/problematic/repo
docker run --name gitoscope -p 8080:3000 -v "$(pwd)":/repo depsir/gitoscope

# Open http://localhost:8080/internals
# Explore the commit graph to understand the issue
```

---

## Learn More About Git Internals

Gitoscope helps you understand:

### Git's Three Areas
1. **Working Directory**: Your file system
2. **Staging Area (Index)**: Files prepared for commit
3. **Repository (.git)**: Committed snapshots

### Git Objects
- **Commits**: Snapshots with metadata (author, message, timestamp)
- **Trees**: Directory structures (like folders)
- **Blobs**: File contents (binary or text)
- **References**: Pointers to commits (branches, tags, HEAD)

### Object Relationships
- Every commit points to a tree (root directory)
- Trees contain blobs (files) and other trees (subdirectories)
- Commits point to parent commits (history)
- References point to commits (branches point to latest commit)

### Useful Resources
- [Git Internals - Git Book](https://git-scm.com/book/en/v2/Git-Internals-Plumbing-and-Porcelain)
- [Git from the Bottom Up](https://jwiegley.github.io/git-from-the-bottom-up/)
- [Git Objects Explained](https://git-scm.com/book/en/v2/Git-Internals-Git-Objects)

---

## Frequently Asked Questions

### Q: Can I use Gitoscope with private repositories?
**A:** Yes! When using Docker with volume mounts, your repository stays on your local machine. Gitoscope only reads the repository; it doesn't send data anywhere.

### Q: Does Gitoscope modify my repository?
**A:** No. Gitoscope only reads from the repository. It cannot modify files, create commits, or change branches.

### Q: Can I use Gitoscope in production?
**A:** Gitoscope is designed as an educational tool, not for production use. It lacks authentication, rate limiting, and other production features.

### Q: Which browsers are supported?
**A:** Gitoscope works in all modern browsers: Chrome, Firefox, Safari, Edge.

### Q: Can I visualize large repositories?
**A:** Gitoscope works best with small to medium repositories. Very large repositories (thousands of commits/files) may have performance issues.

### Q: How do I update to the latest version?
```bash
# Pull the latest Docker image
docker pull depsir/gitoscope

# Or rebuild from source
git pull
docker build -t depsir/gitoscope .
```

---

**Made with ❤️ for Git learners everywhere**

*Gitoscope - Making Git internals visible and understandable*
