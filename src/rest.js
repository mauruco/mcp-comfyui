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
        let request = {};
        let response = {};
        let messageStr = '';
        try {
            request = JSON.parse(body);
            log('log', 'request:', request);
            // Handle the request and get the protocol response
            const { message, comfyParams } = protocol.handleRequest(request);
            messageStr = JSON.stringify(message);

            // Handle ComfyUI calls asynchronously AFTER sending the response
            if (Object.keys(comfyParams).length > 0) {
                const script = path.join(__dirname, 'create-watch-and-move.js');
                const child = spawn('node', [script, JSON.stringify(comfyParams)], {
                    detached: true,
                    stdio: 'ignore'
                });
                child.unref(); // Detached from parent
            }
        } catch (error) {
            log('error', error);
            response = { message: protocol.errorMessage(request.id, -32700, 'JSON Parse error') };
        }
        log('log', 'response:', messageStr);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(messageStr);
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