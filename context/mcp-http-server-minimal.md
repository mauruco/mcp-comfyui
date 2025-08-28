Minimal MCP Server
================================================================================================================================================================

```js
const http = require('http');
const fs = require('fs');

class MCPHTTPServer {
  constructor(port = 8189) {
    this.port = port;
    this.logFile = '/tmp/mcp-http-server.log';
    
    this.tools = [
      {
        name: 'echo',
        description: 'Echo back the input text',
        inputSchema: {
          type: 'object',
          properties: {
            text: {
              type: 'string',
              description: 'The text to echo back'
            }
          },
          required: ['text']
        }
      }
    ];
  }

  log(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;
    fs.appendFileSync(this.logFile, logMessage);
  }

  start() {
    this.log(`HTTP server started on port ${this.port}`);
    
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
          name: 'mcp-http-server',
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

  handleToolsCall(request, res) {
    const { name, arguments: args } = request.params;
    
    if (name === 'echo') {
      if (!args || !args.text) {
        this.sendErrorResponse(res, request.id, -32602, 'Invalid params', 'Missing required parameter: text');
        return;
      }
      
      const response = {
        jsonrpc: '2.0',
        id: request.id,
        result: {
          content: [
            {
              type: 'text',
              text: `Echo: ${args.text}`
            }
          ]
        }
      };
      
      this.sendResponse(res, response);
    } else {
      this.sendErrorResponse(res, request.id, -32601, 'Method not found', `Unknown tool: ${name}`);
    }
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

  stop() {
    this.log('Server stopped');
    if (this.server) {
      this.server.close();
    }
  }
}

const server = new MCPHTTPServer(8189);
server.start();

process.on('SIGINT', () => {
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  server.stop();
  process.exit(0);
});
```