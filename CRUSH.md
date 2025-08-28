# MCP HTTP Server - ComfyUI Integration

## Build/Lint/Test Commands
```bash
# Start the MCP HTTP server
npm start

# Start the MCP HTTP server in development mode
npm run dev

# Run with custom port
node index.js --port 3000

# Run syntax check
npm run type-check

# Run tests (currently placeholder)
npm test

# Install dependencies
npm install
```

## License
This project is licensed under the Apache License 2.0.

## Configuration
The application uses a configuration file (`src/config/index.js`) for managing settings. You can override these settings using environment variables or command-line flags:

### Environment Variables
- `MCP_SERVER_PORT` - Server port (default: 8189)
- `MCP_LOG_FILE` - Log file path (default: ./mcp-comfyui.log)
- `MCP_DEBUG` - Enable debug logging (default: false)
- `COMFYUI_HOST` - ComfyUI host (default: 127.0.0.1)
- `COMFYUI_PORT` - ComfyUI port (default: 8188)
- `COMFYUI_OUTPUT_FOLDER` - ComfyUI output folder (REQUIRED)

### Command Line Flags
- `--port <number>` - Override the server port (takes precedence over environment variable)

### Image ID Management
On server startup, the system automatically detects the last image ID in the ComfyUI output folder using the command `ls -1t | head -n 1`. This determines the next expected image ID for monitoring. When monitoring for generated images, it uses `ls -1t | grep <id>` to check for specific image files. This ensures accurate tracking of generated images even when multiple images are processed.

## Project Structure
```
src/
├── config/           # Configuration files
│   └── index.js      # Main configuration
├── models/           # Model implementations
│   └── flux-krea-t2i.js  # FLUX Krea T2I model
└── server/           # Server implementation
    └── index.js      # Main server file
workflows/            # Workflow JSON files
└── flux-krea-t2i.json
index.js             # Main entry point
```

## Context
- Use the files in the "context" folder as context
- Do not modify any files in context/*

## Docker Usage
When running with Docker Compose, two volumes are mounted:
- `./output:/app/output` - For ComfyUI to save generated images
- `./output-dest:/app/output-dest` - For copying images to the destination folder

The `output_folder` parameter in API calls should use `/app/output-dest` when running in Docker.

## Code Style Guidelines

### Imports & Modules
- Use ES modules import/export syntax (project uses "type": "module")
- Import built-in modules first: `import http from 'http';`
- Group imports logically with blank lines between groups

### Naming Conventions
- Classes: PascalCase (e.g., `MCPHTTPServer`)
- Methods: camelCase (e.g., `handleRequest`, `sendResponse`)
- Variables: camelCase (e.g., `server`, `logFile`)
- Constants: UPPER_SNAKE_CASE for configuration values

### Error Handling
- Wrap JSON.parse operations in try-catch blocks
- Use structured error responses with JSON-RPC 2.0 error codes
- Log all errors with timestamps using the log() method
- Validate request parameters before processing

### HTTP/JSON-RPC
- Always respond with proper JSON-RPC 2.0 format
- Use Content-Type: application/json headers
- Handle both notifications and requests appropriately
- Log all incoming requests and outgoing responses

### File Structure
- Keep server logic in a single class file
- Use shebang for executable scripts: `#!/usr/bin/env node`
- Include process signal handlers for graceful shutdown