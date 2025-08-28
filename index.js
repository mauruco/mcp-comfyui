#!/usr/bin/env node

import { createMCPComfyUIServer } from './src/server/index.js';
import config from './src/config/index.js';

// Parse command-line arguments
const args = process.argv.slice(2);
let port = config.server.port;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' && i + 1 < args.length) {
    port = parseInt(args[i + 1]);
    if (isNaN(port)) {
      console.error('Error: Port must be a valid number');
      process.exit(1);
    }
    break;
  }
}

// Validate required environment variables
if (!config.models['flux-krea-t2i'].outputFolder) {
  console.error('Error: COMFYUI_OUTPUT_FOLDER environment variable is required');
  process.exit(1);
}

// Create and start the server
const server = createMCPComfyUIServer(port);
server.start();

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});