import fs from 'fs';
import readline from 'readline';
import protocol from './protocol.js';

const saveLog = (data) => {
    fs.appendFile('/tmp/mcp-comfyui-log.txt', data + '\n', (err) => {
        if (err) {
            console.error(`Error saving log: ${err.message}`);
        }
    });
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

rl.on('line', (line) => {
    let request;
    try {
        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            return; // Ignora linhas vazias
        }
        
        request = JSON.parse(trimmedLine);
        saveLog(`INPUT: ${trimmedLine}`);

        // unknow messageid
        if (request.error) {
            saveLog('OUTPUT: NOT REPOND TO ERRORS');
            return;
        }
        
        const message = protocol.handleRequest(request, trimmedLine);
        const output = JSON.stringify(message);
        saveLog(`OUTPUT: ${output}`);
        console.log(output);

    } catch (error) {
        // Agora 'request' é um objeto ou undefined
        const requestId = request ? request.id : null;
        const errorMessage = protocol.errorMessage(requestId, -32700, 'Parse error');
        const output = JSON.stringify(errorMessage);
        saveLog(`ERROR: ${output}`);
        console.log(output);
    }
});

rl.on('close', () => {
    process.exit(0);
});