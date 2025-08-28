# MCP ComfyUI Server

A Model Context Protocol (MCP) HTTP server that integrates with ComfyUI to provide high-quality image generation capabilities using FLUX models.

## Features

- **MCP Protocol Support**: Implements the MCP protocol for seamless integration with AI assistants
- **FLUX Model Integration**: Built-in support for FLUX Krea T2I model for image generation
- **Asynchronous Processing**: Image generation runs in the background with progress monitoring
- **Configurable**: Highly configurable via environment variables and command-line flags
- **Error Handling**: Robust error handling and logging
- **Modern ES Modules**: Uses ES modules for clean, modern JavaScript code

## Prerequisites

- Node.js >= 16.0.0
- ComfyUI running on `http://127.0.0.1:8188` (configurable)
- Access to FLUX models in ComfyUI

## Installation

### Local Installation

1. Clone the repository:
# Run tests (placeholder)
npm test
```

## Usagebash
git clone <repository-url>
cd mcp-comfyui
# Run tests (placeholder)
npm test
```

## Usage

2. Install dependencies:
# Run tests (placeholder)
npm test
```

## Usagebash
npm install
# Run tests (placeholder)
npm test
```

## Usage

3. Ensure ComfyUI is running and configured with the required FLUX models.

### Docker Installation

1. Build the Docker image:
# Run tests (placeholder)
npm test
```

## Usagebash
docker build -t mcp-comfyui .
# Run tests (placeholder)
npm test
```

## Usage

2. Run the Docker container:
# Run tests (placeholder)
npm test
```

## Usagebash
# Basic run (COMFYUI_OUTPUT_FOLDER is required)
docker run -p 8189:8189 \
  -e COMFYUI_OUTPUT_FOLDER=/app/output \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/output-dest:/app/output-dest \
  mcp-comfyui

# Run with custom port
docker run -p 3000:3000 \
  -e COMFYUI_OUTPUT_FOLDER=/app/output \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/output-dest:/app/output-dest \
  mcp-comfyui node index.js --port 3000

# Run with environment variables
docker run -p 8189:8189 \
  -e MCP_SERVER_PORT=8189 \
  -e COMFYUI_HOST=host.docker.internal \
  -e MCP_DEBUG=true \
  -e COMFYUI_OUTPUT_FOLDER=/app/output \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/output-dest:/app/output-dest \
  mcp-comfyui

# Run with volume for output and logs (logs only written when MCP_DEBUG=true)
docker run -p 8189:8189 \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/output-dest:/app/output-dest \
  -e COMFYUI_OUTPUT_FOLDER=/app/output \
  -e MCP_DEBUG=true \
  mcp-comfyui

# Run in background (detached)
docker run -d -p 8189:8189 \
  -e COMFYUI_OUTPUT_FOLDER=/app/output \
  -v $(pwd)/output:/app/output \
  -v $(pwd)/output-dest:/app/output-dest \
  --name mcp-comfyui-server mcp-comfyui
# Run tests (placeholder)
npm test
```

## Usage

### Docker Compose (Optional)

Create a `docker-compose.yml` file:

# Run tests (placeholder)
npm test
```

## Usageyaml
version: '3.8'

services:
  mcp-comfyui:
    build: .
    ports:
      - "8189:8189"
    environment:
      - COMFYUI_HOST=host.docker.internal
      - MCP_LOG_FILE=./mcp-comfyui.log
      - COMFYUI_OUTPUT_FOLDER=/app/output
    volumes:
      - ./output:/app/output
      - ./output-dest:/app/output-dest
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "node", "-e", "require('http').get('http://localhost:8189/mcp', (res) => { process.exit(res.statusCode === 404 ? 0 : 1) }).on('error', () => process.exit(1))"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 40s
# Run tests (placeholder)
npm test
```

## Usage

Run with Docker Compose:
# Run tests (placeholder)
npm test
```

## Usagebash
docker-compose up -d
# Run tests (placeholder)
npm test
```

## Usage

## Usage

### Basic Usage

Start the server with default settings:
# Run tests (placeholder)
npm test
```

## Usagebash
npm start
# Run tests (placeholder)
npm test
```

## Usage

### Custom Port

Start the server on a specific port using command-line flag:
# Run tests (placeholder)
npm test
```

## Usagebash
node index.js --port 3000
# Run tests (placeholder)
npm test
```

## Usage

### Environment Variables

Start the server using environment variables for configuration:
# Run tests (placeholder)
npm test
```

## Usagebash
MCP_SERVER_PORT=3000 npm start
# Run tests (placeholder)
npm test
```

## Usage

### Available Commands

# Run tests (placeholder)
npm test
```

## Usagebash
# Start the server (logging disabled by default)
npm start

# Start the server with debug logging enabled
npm run start:debug

# Start in development mode (logging disabled by default)
npm run dev

# Start in development mode with debug logging enabled
npm run dev:debug

# Run syntax checking
npm run type-check

# Run tests (placeholder)
npm test
# Run tests (placeholder)
npm test
```

## Usage</think> server (logging disabled by default)
npm start

# Start</think> the server
npm start

# Start in development mode
npm run dev

# Run syntax checking
npm run type-check

# Run tests (placeholder)
npm test
# Run tests (placeholder)
npm test
```

## Usage

## Configuration

### Environment Variables

The application can be configured using the following environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_SERVER_PORT` | Server port | `8189` |
| `MCP_LOG_FILE` | Log file path | `./mcp-comfyui.log` |
| `MCP_DEBUG` | Enable debug logging | `false` |
| `COMFYUI_HOST` | ComfyUI host | `127.0.0.1` |
| `COMFYUI_PORT` | ComfyUI port | `8188` |
| `COMFYUI_OUTPUT_FOLDER` | ComfyUI output folder | **REQUIRED** |

### Command Line Flags

| Flag | Description |
|------|-------------|
| `--port <number>` | Override the server port (takes precedence over `MCP_SERVER_PORT`) |

### Configuration Priority

Configuration is applied in the following order (higher priority overrides lower):

1. Command-line flags (`--port`)
2. Environment variables
3. Configuration file defaults

## API Usage

The server provides an MCP-compatible HTTP endpoint at `/mcp` that accepts POST requests with JSON-RPC 2.0 format.

### Available Tools

#### `generate_image`

Generate images using FLUX models.

**Parameters:**
- `width`: Image width (max 1024, default 544)
- `height`: Image height (max 1024, default 544)
- `seed`: Random seed for generation (default: random)
- `prompt`: English text prompt optimized for FLUX models (default: "a lovely place")
- `model`: FLUX model to use (default: "flux-krea-t2i")
- `output_folder`: Absolute path where the generated image should be copied (required). For Docker usage, this should be `/app/output-dest` to match the mounted volume.

**Note for Docker Usage:**
- When running in Docker, use `/app/output-dest` as the `output_folder` parameter
- This corresponds to the mounted volume `./output-dest:/app/output-dest`
- Images will be available in the local `./output-dest` directory after generation

**Example Request:**
# Run tests (placeholder)
npm test
```

## Usagejson
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "generate_image",
    "arguments": {
      "prompt": "A beautiful sunset over mountains",
      "width": 512,
      "height": 512,
      "output_folder": "/app/output-dest"
    }
  }
}
# Run tests (placeholder)
npm test
```

## Usage

**Example Response:**
# Run tests (placeholder)
npm test
```

## Usagejson
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "Image generation completed using flux-krea-t2i model with parameters: width=512, height=512, seed=123456789"
      },
      {
        "type": "text",
        "text": "English prompt: A beautiful sunset over mountains"
      },
      {
        "type": "text",
        "text": "Execution ID: 42"
      },
      {
        "type": "text",
        "text": "Image will be copied to: /path/to/output/folder"
      }
    ]
  }
}
# Run tests (placeholder)
npm test
```

## Usage

## Project Structure

# Run tests (placeholder)
npm test
```

## Usage
src/
├── config/           # Configuration files
│   └── index.js      # Main configuration
├── models/           # Model implementations
│   └── flux-krea-t2i.js  # FLUX Krea T2I model
├── server/           # Server implementation
│   └── index.js      # Main server file
└── workflows/        # Workflow JSON files
    └── flux-krea-t2i.json
index.js             # Main entry point
# Run tests (placeholder)
npm test
```

## Usage

## Development

### Code Style

- Use ES modules import/export syntax
- Import built-in modules first: `import http from 'http';`
- Follow the established naming conventions
- Keep the code DRY (Don't Repeat Yourself)

### Testing

# Run tests (placeholder)
npm test
```

## Usagebash
npm run type-check  # Run syntax checking
npm test            # Run tests (currently placeholder)
# Run tests (placeholder)
npm test
```

## Usage

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   - Use `--port` flag or `MCP_SERVER_PORT` to specify a different port
   - Check if another service is using the default port

2. **COMFYUI_OUTPUT_FOLDER Not Set**
   - Ensure `COMFYUI_OUTPUT_FOLDER` environment variable is set
   - This parameter is required for the server to start
   - Example: `COMFYUI_OUTPUT_FOLDER=/path/to/output npm start`

3. **ComfyUI Connection Issues**
   - Ensure ComfyUI is running on the specified host and port
   - Check ComfyUI logs for any issues

4. **Workflow Loading Errors**
   - Verify that the workflow JSON files exist in the `workflows/` directory
   - Check file permissions

5. **Image Generation Fails**
   - Ensure FLUX models are properly installed in ComfyUI
   - Check ComfyUI console for error messages

### Docker Troubleshooting

1. **Container Won't Start**
   # Run tests (placeholder)
npm test
```

## Usagebash
   docker logs mcp-comfyui-server
   docker logs <container-id>
   # Run tests (placeholder)
npm test
```

## Usage

2. **COMFYUI_OUTPUT_FOLDER Not Set in Docker**
   - Ensure `COMFYUI_OUTPUT_FOLDER` environment variable is set when running the container
   - Mount the output directory as a volume: `-v $(pwd)/output:/app/output`
   - Mount the destination directory as a volume: `-v $(pwd)/output-dest:/app/output-dest`
   - Example: `docker run -e COMFYUI_OUTPUT_FOLDER=/app/output -v $(pwd)/output:/app/output -v $(pwd)/output-dest:/app/output-dest mcp-comfyui`

3. **ComfyUI Connection from Docker**
   - Use `host.docker.internal` as ComfyUI host when running Docker on Mac/Windows
   - On Linux, you may need to use your host machine's IP address
   - Example: `docker run -e COMFYUI_HOST=172.17.0.1 mcp-comfyui`

4. **Permission Issues**
   - Ensure the output and destination directories have proper permissions
   - Check volume mounts if using custom locations
   - Both `./output` and `./output-dest` directories need write permissions

5. **Logging Issues**
   - Enable debug logging with `MCP_DEBUG=true`
   - Check if logs are being written to `./mcp-comfyui.log`
   - Verify log file permissions

5. **Health Check Failures**
   # Run tests (placeholder)
npm test
```

## Usagebash
   docker inspect --format='{{json .State.Health}}' mcp-comfyui-server
   # Run tests (placeholder)
npm test
```

## Usage

6. **Build Issues**
   # Run tests (placeholder)
npm test
```

## Usagebash
   docker build --no-cache -t mcp-comfyui .
   # Run tests (placeholder)
npm test
```

## Usage

### Logging

The application logging is controlled by the `MCP_DEBUG` environment variable:

- **MCP_DEBUG=false** (default): Logging is disabled
- **MCP_DEBUG=true`: Logging is enabled to `/tmp/mcp-comfyui.log`

**Enable logging:**
# Run tests (placeholder)
npm test
```

## Usagebash
MCP_DEBUG=true npm start
# Run tests (placeholder)
npm test
```

## Usage

**Enable logging with Docker:**
# Run tests (placeholder)
npm test
```

## Usagebash
docker run -p 8189:8189 -e MCP_DEBUG=true mcp-comfyui
# Run tests (placeholder)
npm test
```

## Usage

**Check logs:**
# Run tests (placeholder)
npm test
```

## Usagebash
# Local installation
tail -f /tmp/mcp-comfyui.log

# Docker container
docker logs mcp-comfyui-server

# Docker with volume mount
tail -f ./logs/mcp-comfyui.log
# Run tests (placeholder)
npm test
```

## Usage

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the log files
3. Open an issue on the repository

## Acknowledgments

- [ComfyUI](https://github.com/comfyanonymous/ComfyUI) for the powerful image generation backend
- [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) for the standard communication protocol
- FLUX model contributors for the excellent image generation capabilities