# MCP ComfyUI Development Guide

## Commands
- **Start REST server**: `npm run start:rest` (set COMFYUI_OUTPUT_PATH env var)
- **Start STDIO server**: `npm run start:std` (set COMFYUI_OUTPUT_PATH env var)
- **Development mode**: `npm run dev:rest` or `npm run dev:std`
- **Type check**: `npm run type-check`
- **Lint**: `npm run lint` (ESLint configured with semicolons and prefer-const)

## Code Style
- **ES Modules**: Use import/export syntax (type: "module" in package.json)
- **Semicolons**: Required (ESLint rule: "semi": "error")
- **Constants**: Use const by default (ESLint rule: "prefer-const": "error")
- **Error handling**: Wrap JSON.parse in try-catch, provide meaningful error messages
- **Logging**: Use config.server.debug flag, saveLog() function for persistent logging
- **File paths**: Use path.normalize() and path.join() for cross-platform compatibility
- **Async operations**: Spawn detached processes for long-running ComfyUI tasks

## Project Structure
- **Protocol layer**: src/protocol.js handles MCP JSON-RPC 2.0 requests
- **Server modes**: REST (src/rest.js) and STDIO (src/std.js) 
- **Models**: src/models.js generates ComfyUI workflow payloads
- **Workflows**: JSON workflow files in src/workflows/
- **Config**: Environment-based configuration in src/config.js

## Testing
No test framework configured yet. Tests should be added to validate MCP protocol compliance and ComfyUI integration.