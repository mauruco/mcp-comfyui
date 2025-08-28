import http from 'http';
import fs from 'fs';
import axios from 'axios';
import FluxKreaT2I from '../models/flux-krea-t2i.js';
import config from '../config/index.js';

class MCPComfyUIServer {
  constructor(port = config.server.port) {
    this.port = port;
    this.logFile = config.server.logFile;
    this.comfyuiPromptUrl = config.comfyui.promptUrl;
    
    // Validate required environment variables
    if (!config.models['flux-krea-t2i'].outputFolder) {
      throw new Error('COMFYUI_OUTPUT_FOLDER environment variable is required');
    }
    
    this.models = {
      'flux-krea-t2i': new FluxKreaT2I()
    };
    
    this.tools = [
      {
        name: 'generate_image',
        description: 'Generate high-quality images using ComfyUI with FLUX models. The prompt should be in English and optimized for FLUX for best results. The image generation is asynchronous and will be processed in the background. When the generation is complete, the image will be automatically copied to the specified output folder.',
        inputSchema: {
          type: 'object',
          properties: {
            width: {
              type: 'number',
              description: `Image width (max ${config.models['flux-krea-t2i'].limits.maxWidth}, default ${config.models['flux-krea-t2i'].defaults.width})`,
              minimum: 1,
              maximum: config.models['flux-krea-t2i'].limits.maxWidth,
              default: config.models['flux-krea-t2i'].defaults.width
            },
            height: {
              type: 'number',
              description: `Image height (max ${config.models['flux-krea-t2i'].limits.maxHeight}, default ${config.models['flux-krea-t2i'].defaults.height})`,
              minimum: 1,
              maximum: config.models['flux-krea-t2i'].limits.maxHeight,
              default: config.models['flux-krea-t2i'].defaults.height
            },
            seed: {
              type: 'number',
              description: 'Random seed for generation (default: random)'
            },
            prompt: {
              type: 'string',
              description: 'English text prompt optimized for FLUX models. Be descriptive and specific for best results.',
              default: config.models['flux-krea-t2i'].defaults.prompt
            },
            model: {
              type: 'string',
              description: 'FLUX model to use for generation',
              enum: ['flux-krea-t2i'],
              default: config.models['flux-krea-t2i'].name
            },
            output_folder: {
              type: 'string',
              description: 'Absolute path where the generated image will be copied after asynchronous generation is complete'
            }
          },
          required: ['output_folder']
        }
      }
    ];
  }

  log(message) {
    if (!config.server.debug) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }

  async start() {
    console.log(`MCP ComfyUI server started on port ${this.port}`);
    this.log(`MCP ComfyUI server started on port ${this.port}`);
    
    this.server = http.createServer((req, res) => {
      if (req.method === 'POST' && req.url === '/mcp') {
        this.handleRequest(req, res);
      } else {
        this.log(`INVALID REQUEST: ${req.method} ${req.url}`);
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not found' }));
      }
    });

    this.server.listen(this.port, () => {
      console.log(`Server listening on http://localhost:${this.port}/mcp`);
      this.log(`Server listening on http://localhost:${this.port}/mcp`);
    });
  }

  handleRequest(req, res) {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk.toString();
    });

    req.on('end', () => {
      this.log(`INPUT: ${body}`);
      
      try {
        const request = JSON.parse(body);
        this.processRequest(request, res);
      } catch (error) {
        this.log(`PARSE ERROR: ${error.message}`);
        this.sendErrorResponse(res, null, -32700, 'Parse error', error.message);
      }
    });
  }

  processRequest(request, res) {
    if (request.id === undefined || request.id === null) {
      if (request.method === 'notifications/initialized') {
        this.log('NOTIFICATION: notifications/initialized');
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ jsonrpc: '2.0', result: 'ok' }));
        return;
      }
      this.sendErrorResponse(res, null, -32600, 'Invalid Request', 'Missing request id');
      return;
    }

    switch (request.method) {
      case 'initialize':
        this.handleInitialize(request, res);
        break;
      case 'tools/list':
        this.handleToolsList(request, res);
        break;
      case 'tools/call':
        this.handleToolsCall(request, res);
        break;
      default:
        this.sendErrorResponse(res, request.id, -32601, 'Method not found', `Unknown method: ${request.method}`);
    }
  }

  handleInitialize(request, res) {
    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {}
        },
        serverInfo: {
          name: 'mcp-comfyui-server',
          version: '1.0.0'
        }
      }
    };
    
    this.sendResponse(res, response);
  }

  handleToolsList(request, res) {
    const response = {
      jsonrpc: '2.0',
      id: request.id,
      result: {
        tools: this.tools
      }
    };
    
    this.sendResponse(res, response);
  }

  async handleToolsCall(request, res) {
    const { name, arguments: args } = request.params;
    
    if (name === 'generate_image') {
      try {
        const params = this.validateImageParams(args);
        const modelInstance = this.models[params.model];
        
        if (!modelInstance) {
          throw new Error(`Unsupported model: ${params.model}`);
        }

        const nextId = await this.getNextId(modelInstance.comfyuiOutputPath);
        const nextFileName = `api_${nextId}_.${modelInstance.fileExtension}`;
        
        this.log(`Filename: ${nextFileName}`);

        const workflow = modelInstance.loadWorkflow();
        const updatedWorkflow = modelInstance.updateWorkflowWithParams(workflow, params);
        
        const payload = {
          prompt: updatedWorkflow
        };
        
        this.log(`Sending workflow to ComfyUI: ${JSON.stringify(payload)}`);
        
        const response = await axios.post(this.comfyuiPromptUrl, payload, {
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const executionId = response.data.number;
        this.log(`Execution started with ID: ${executionId}`);
        
        modelInstance.monitorImageGeneration(executionId, params, nextFileName, (message) => {
          this.log(message);
        });
        
        const resultResponse = {
          jsonrpc: '2.0',
          id: request.id,
          result: {
            content: [
              {
                type: 'text',
                text: `Image generation started asynchronously using ${params.model} model with parameters: width=${params.width}, height=${params.height}, seed=${params.seed}`
              },
              {
                type: 'text',
                text: `English prompt: ${params.prompt}`
              },
              {
                type: 'text',
                text: `Execution ID: ${executionId}`
              },
              {
                type: 'text',
                text: `The image is being generated in the background. When complete, it will be automatically copied to: ${params.output_folder}`
              },
              {
                type: 'text',
                text: `Expected file name: ${nextFileName}`
              },
              {
                type: 'text',
                text: `Note: This is an asynchronous operation. The image generation will continue running in the background even after this response is returned.`
              }
            ]
          }
        };
        
        this.sendResponse(res, resultResponse);
        
      } catch (error) {
        this.log(`COMFYUI ERROR: ${error.message}`);
        const errorMessage = error.response ? 
          `ComfyUI error: ${error.response.data}` : 
          `Failed to generate image: ${error.message}`;
        this.sendErrorResponse(res, request.id, -32603, 'Internal error', errorMessage);
      }
    } else {
      this.sendErrorResponse(res, request.id, -32601, 'Method not found', `Unknown tool: ${name}`);
    }
  }

  validateImageParams(args) {
    const modelConfig = config.models['flux-krea-t2i'];
    
    const params = {
      width: args?.width || modelConfig.defaults.width,
      height: args?.height || modelConfig.defaults.height,
      seed: args?.seed || Math.floor(Math.random() * 1000000000),
      prompt: args?.prompt || modelConfig.defaults.prompt,
      model: args?.model || modelConfig.name,
      output_folder: args?.output_folder
    };

    if (params.width > modelConfig.limits.maxWidth) params.width = modelConfig.limits.maxWidth;
    if (params.height > modelConfig.limits.maxHeight) params.height = modelConfig.limits.maxHeight;

    const modelInstance = this.models[params.model];
    if (!modelInstance) {
      throw new Error(`Unsupported model: ${params.model}`);
    }

    return modelInstance.validateParams(params);
  }

  sendResponse(res, response) {
    const responseStr = JSON.stringify(response);
    this.log(`OUTPUT: ${responseStr}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(responseStr);
  }

  sendErrorResponse(res, id, code, message, data = null) {
    const error = {
      jsonrpc: '2.0',
      id: id !== null && id !== undefined ? id : 0,
      error: {
        code: code,
        message: message
      }
    };
    
    if (data) {
      error.error.data = data;
    }
    
    const errorStr = JSON.stringify(error);
    this.log(`ERROR: ${errorStr}`);
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(errorStr);
  }

  async getNextId(outputPath) {
    const { execSync } = await import('child_process');
    
    try {
      // Change to output directory and run ls command
      const command = `cd "${outputPath}" && ls -1t | head -n 1`;
      const result = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
      let nextId = '00001';
      if (result.trim()) {
        const latestFile = result.trim();
        const match = latestFile.match(/(\d+)_/);
        if (match) {
          nextId = (parseInt(match[1]) + 1).toString().padStart(5, '0');
        }
      }
      this.log(`Next image ID: ${nextId}`);
      return nextId;
    } catch (error) {
      this.log(`Error getting last image ID: ${error.message}`);
      return '00001';
    }
  }
}

export function createMCPComfyUIServer(port = config.server.port) {
  return new MCPComfyUIServer(port);
}