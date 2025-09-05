import http from 'http';
import protocol from './protocol.js';

const handleRequest = (req, res) => {
    let body = '';

    req.on('data', (chunk) => {
        body += chunk.toString();
    });

    req.on('end', () => {
        let request = {};
        let message = {}
        try {
            request = JSON.parse(body);
            console.log('request:', request);
            message = protocol.handleRequest(request);
        } catch (error) {
            console.error(error);
            message = protocol.errorMessage(request.id, -32700, 'JSON Parse error');
            console.error(message);
        }
        const messageStr = JSON.stringify(message);
        console.log('response:', messageStr);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(messageStr);
    });
}

const startServer = () => {
    const server = http.createServer((req, res) => {
        console.log('what');
        if (req.method === 'POST' && req.url === '/mcp') {
            handleRequest(req, res);
        } else {
            res.writeHead(404, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Not found' }));
        }
    });

    server.listen(8190, () => {
      console.log(`Server listening on http://localhost:8190/mcp`);
    });
}

startServer();