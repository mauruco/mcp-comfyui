const config = {
  // Server configuration
  server: {
    port: process.env.MCP_SERVER_PORT || 8189,
    logFile: process.env.MCP_LOG_FILE || './mcp-comfyui.log',
    debug: process.env.MCP_DEBUG === 'true' || false
  },
  
  // ComfyUI configuration
  comfyui: {
    host: process.env.COMFYUI_HOST || '127.0.0.1',
    port: process.env.COMFYUI_PORT || 8188,
    promptEndpoint: '/prompt'
  },
  
  // Model configurations
  models: {
    'flux-krea-t2i': {
      name: 'flux-krea-t2i',
      fileExtension: 'png',
      outputFolder: process.env.COMFYUI_OUTPUT_FOLDER ? process.env.COMFYUI_OUTPUT_FOLDER : "/tmp/",
      polling: {
        interval: 5000,
        maxAttempts: 300
      },
      defaults: {
        width: 544,
        height: 544,
        prompt: 'a lovely place'
      },
      limits: {
        maxWidth: 1024,
        maxHeight: 1024
      }
    }
  }
};

// Computed values
config.comfyui.baseUrl = `http://${config.comfyui.host}:${config.comfyui.port}`;
config.comfyui.promptUrl = `${config.comfyui.baseUrl}${config.comfyui.promptEndpoint}`;

export default config;