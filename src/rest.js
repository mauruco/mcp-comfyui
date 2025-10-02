import http from 'http';
import { spawn } from 'child_process';
import path from 'path';
import config from './config.js';
import protocol from './protocol.js';
const __dirname = import.meta.dirname;

if (!config.comfyui.comfyUIOutputPath) {
    console.error('Error: COMFYUI_OUTPUT_PATH environment variable is required');
    process.exit(1);
}

const log=(type, ...message) => {
    if (!config.server.debug) return;
    if (type == 'log') return console.log(message);
    console.error(message);
};

const handleRequest = (req, res) => {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', async () => {
        try {
            log('log', 'request:', body);
            // Handle the request and get the protocol response
            const { message, comfyParams, respond } = protocol.handleRequest(body);

            // Don't respond 
            if (!respond) {
                res.writeHead(200);
                return res.end();
            }

            // Handle ComfyUI calls asynchronously AFTER sending the response
            if (Object.keys(comfyParams).length > 0) {
                const script = path.join(__dirname, 'create-watch-and-move.js');
                const child = spawn('node', [script, JSON.stringify(comfyParams)], {
                    detached: true,
                    stdio: 'ignore'
                });
                child.unref(); // Detached from parent
            }

            res.writeHead(200, { 'Content-Type': 'application/json' });
            return res.end(message);
            
        } catch (error) {
            log('error', error);
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(protocol.errorMessage(null, -32603, 'Internal error', error.message));
        }
    });
};

const startServer = async () => {
    const server = http.createServer((req, res) => {
        if (req.method === 'POST' && req.url === '/mcp') {
            handleRequest(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });

    server.listen(config.server.port, () => {
      console.log(`Server listening on http://localhost:${config.server.port}/mcp`);
    });
};

startServer();