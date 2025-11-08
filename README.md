# Gitoscope

> An educational tool to visualize and understand Git internals

Gitoscope provides an interactive web interface for exploring how Git manages files, commits, trees, and blobs. Perfect for learning Git's internal object model and understanding the relationship between the working copy, staging area, and HEAD commit.

## Features

- **Working Copy Visualization**: See your current file system state
- **Staging Area View**: Understand what's staged for the next commit
- **HEAD Commit Details**: Explore the current commit contents
- **Git Internals Graph**: Visual representation of commits, trees, and blobs
- **Real-time Updates**: Reflect changes as you manipulate the repository
- **Interactive Exploration**: Click through Git objects to understand relationships

## Requirements

- **Node.js**: >= 22.0.0
- **npm**: >= 10.0.0
- **Git**: Any recent version

Or use Docker (no local installation required).

## Quick Start

### Using Docker (Recommended)

#### With Internal Repository

Start Gitoscope with a built-in empty repository:

```bash
docker run --name gitoscope -p 8080:3000 depsir/gitoscope
```

Open your browser at http://localhost:8080

To manipulate the repository, enter the container:

```bash
docker exec -it gitoscope /bin/sh
cd /repo
# Make git operations here
```

#### With External Repository

Mount a local Git repository to visualize:

```bash
docker run --name gitoscope -p 8080:3000 -v /path/to/your/repo:/repo depsir/gitoscope
```

Or use the current directory:

```bash
docker run --name gitoscope -p 8080:3000 -v "$(pwd)":/repo depsir/gitoscope
```

### Local Development

#### Setup

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

   Edit `config.js` and set the `repo` path to your target Git repository:

   ```javascript
   module.exports = {
     repo: '/path/to/your/git/repository',
   };
   ```

4. **Start the application**
   ```bash
   npm start
   ```

Open http://localhost:3000 in your browser.

#### Development Mode

Run with auto-reload on file changes:

```bash
npm run watch
```

Run with debugging and auto-reload:

```bash
npm run watchd
```

Debug mode without auto-reload:

```bash
npm run debug
```

## Development

### Available Scripts

- `npm start` - Start the production server
- `npm run watch` - Development mode with auto-reload (nodemon)
- `npm run watchd` - Development mode with debugging and auto-reload
- `npm run debug` - Debug mode with Node.js inspector
- `npm test` - Run tests with Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run lint` - Check code quality with ESLint
- `npm run lint:fix` - Fix auto-fixable ESLint issues
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

### Code Quality

This project uses:

- **ESLint** for code linting
- **Prettier** for code formatting
- **Jest** for testing

Run before committing:

```bash
npm run lint
npm run format
npm test
```

### Project Structure

```
gitoscope/
├── bin/              # Server bootstrap
├── controllers/      # API request handlers
├── lib/              # Core Git operations
├── public/           # Frontend assets (React, CSS)
├── routes/           # Express route definitions
├── views/            # Pug templates
├── app.js            # Express application setup
└── config.js         # Repository configuration
```

## Configuration

The application requires a `config.js` file created from `config.js.template`:

```javascript
module.exports = {
  repo: '/absolute/path/to/git/repository',
};
```

**Note**: The application will exit with an error if `config.js` is not found.

## Environment Variables

- `PORT` - Server port (default: 3000)
- `DEBUG` - Enable debug logging (e.g., `DEBUG=gitoscope:*`)

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Detailed architecture and design decisions
- [API.md](./API.md) - REST API endpoint documentation
- [CLAUDE.md](./CLAUDE.md) - AI assistant context for development

## Testing

Run the test suite:

```bash
npm test
```

With coverage:

```bash
npm run test:coverage
```

Watch mode for development:

```bash
npm run test:watch
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests and linting (`npm test && npm run lint`)
5. Commit your changes (use conventional commits)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## License

MIT

## Authors

- **Francesco Sacchi** - <sacchi@intre.it>

### Contributors

- Andrea Caglio - <caglio@intre.it>
- Gianni Bombelli (bombo82) - <bombo82@giannibombelli.it>

## Learn More

Gitoscope is an educational tool designed to help developers understand:

- How Git stores objects (commits, trees, blobs)
- The relationship between working directory, staging area, and repository
- How Git tracks changes across commits
- The internal structure of Git's object database

Perfect for:

- Learning Git internals
- Teaching Git concepts
- Understanding Git's object model
- Debugging complex Git situations

---

Made with ❤️ for Git learners everywhere
