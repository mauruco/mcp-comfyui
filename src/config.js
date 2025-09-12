const config = {
  // Server configuration
  server: {
    port: process.env.MCP_SERVER_PORT || 8190,
    logFile: process.env.MCP_LOG_FILE || '/tmp/mcp-comfyui.log',
    debug: process.env.MCP_DEBUG === 'true' || false
  },
  
  // ComfyUI configuration
  comfyui: {
    host: process.env.COMFYUI_HOST || '127.0.0.1',
    port: process.env.COMFYUI_PORT || 8188,
    comfyUIOutputPath: process.env.COMFYUI_OUTPUT_PATH
  },
};

export default config;