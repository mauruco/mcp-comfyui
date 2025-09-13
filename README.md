# MCP ComfyUI Server

MCP server for ComfyUI integration, enabling image and video generation via MCP protocol.

## Installation

```bash
npm install
```

## Usage

### MCP Configuration

Add to your MCP configuration file:

```json
{
  "comfyui": {
    "type": "stdio",
    "command": "node",
    "args": [
      "/home/dev/Downloads/_development/mcp-comfyui/src/std.js"
    ],
    "env": {
      "COMFYUI_OUTPUT_PATH": "/home/dev/Downloads/_comfyui/output/",
      "MCP_DEBUG": "true"
    }
  }
}
```

### Environment Variables

- `COMFYUI_OUTPUT_PATH`: ComfyUI output directory (required)
- `MCP_DEBUG`: Enable debug logging (optional, default: false)
- `MCP_SERVER_PORT`: REST server port (optional, default: 8190)

### Scripts

- `npm run start:rest` - Start REST server
- `npm run start:std` - Start STDIO server
- `npm run dev:rest` - Development mode REST
- `npm run dev:std` - Development mode STDIO

## Features

- Image generation with FLUX model
- Asynchronous background processing
- Custom dimension support
- Seed control for reproducibility