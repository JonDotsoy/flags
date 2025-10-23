# New Flags Examples

This directory contains practical examples of using the `new-flags` library.

## Running Examples

All examples can be run with Bun:

```bash
bun run samples/<example>.ts [options]
```

## Examples

### 1. Basic (`basic.ts`)

A simple example with boolean flags.

```bash
# Show help
bun run samples/basic.ts --help

# Run with verbose flag
bun run samples/basic.ts --verbose
bun run samples/basic.ts -v
```

### 2. Server (`server.ts`)

Web server configuration with required and optional flags.

```bash
# Show help
bun run samples/server.ts --help

# Start server on port 3000
bun run samples/server.ts --port 3000

# Start with SSL
bun run samples/server.ts --port 443 --ssl --cert ./cert.pem --key ./key.pem

# With custom host and verbose logging
bun run samples/server.ts -p 8080 -h 0.0.0.0 -v
```

### 3. Build Tool (`build.ts`)

Build tool example with multiple string flags (arrays).

```bash
# Show help
bun run samples/build.ts --help

# Basic build
bun run samples/build.ts --entry src/index.ts --output dist

# Build with minification and source maps
bun run samples/build.ts -e src/index.ts -o dist -m -s

# Build with external dependencies
bun run samples/build.ts -e src/index.ts -o dist --external react --external react-dom

# Watch mode
bun run samples/build.ts -e src/index.ts -o dist -w
```

### 4. Docker Run (`docker.ts`)

Docker-like CLI with multiple port and volume mappings.

```bash
# Show help
bun run samples/docker.ts --help

# Run basic container
bun run samples/docker.ts --image nginx

# Run with port mapping
bun run samples/docker.ts -i nginx -p 8080:80

# Run with multiple ports and environment variables
bun run samples/docker.ts -i node:18 -p 3000:3000 -e NODE_ENV=production -e PORT=3000

# Run with volumes and auto-remove
bun run samples/docker.ts -i postgres -v /data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=secret --rm

# Run detached with name
bun run samples/docker.ts -i redis -d --name my-redis -p 6379:6379
```

### 5. Git Clone (`git-clone.ts`)

Git clone-like example with various options.

```bash
# Show help
bun run samples/git-clone.ts --help

# Clone repository
bun run samples/git-clone.ts --repo https://github.com/user/repo.git

# Clone specific branch
bun run samples/git-clone.ts -r https://github.com/user/repo.git -b develop

# Shallow clone
bun run samples/git-clone.ts -r https://github.com/user/repo.git --depth 1

# Clone with submodules
bun run samples/git-clone.ts -r https://github.com/user/repo.git --recursive

# Quiet mode
bun run samples/git-clone.ts -r https://github.com/user/repo.git -q

# Verbose mode with custom output
bun run samples/git-clone.ts -r https://github.com/user/repo.git -v -o my-project
```

## Key Features Demonstrated

- **Boolean flags**: Simple on/off switches (`--verbose`, `--ssl`)
- **String flags**: Single string values (`--host`, `--branch`)
- **Number flags**: Numeric values (`--port`, `--depth`)
- **String arrays**: Multiple values (`--external`, `--port`, `--env`)
- **Required flags**: Flags that must be provided (`--port`, `--entry`)
- **Optional flags**: Flags with default behavior
- **Short aliases**: Single-letter shortcuts (`-v`, `-p`, `-h`)
- **Descriptions**: Help text for each flag
- **Program metadata**: Program name and description
- **Fluent API**: Chainable method calls
- **Help messages**: Auto-generated usage information
