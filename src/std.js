import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn } from 'child_process';
import config from './config.js';
import protocol from './protocol.js';
const __dirname = import.meta.dirname;

// import os from 'os';
// const checkAndExitIfLowPriority = () => {
//     const currentPriority = os.getPriority();
//     if (currentPriority <= 0) {
//         // low priority, exit, probally not needed
//         process.exit(0);
//     }
// };

const saveLog = (data) => {
    if (!config.server.debug) return;
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    fs.appendFile(config.server.logFile, dataStr + '\n', (err) => {});
};

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false
});

// Use o evento 'line' para processar cada mensagem do cliente
rl.on('line', async (line) => {
    let request;
    try {
        // setInterval(checkAndExitIfLowPriority, 3000);

        const trimmedLine = line.trim();
        if (trimmedLine === '') {
            return;
        }

        request = JSON.parse(trimmedLine);
        saveLog(`INPUT: ${trimmedLine}`);
        
        // Input is an error
        if (request.error) {
            saveLog('OUTPUT: NOT RESPONDING TO ERRORS');
            // process.exit(0);
            return;
        }

        // Handle the request and get the protocol response
        const { message, comfyParams } = protocol.handleRequest(request);
        const output = JSON.stringify(message);

        // Handle ComfyUI calls asynchronously AFTER sending the response
        if (Object.keys(comfyParams).length > 0) {
            const script = path.join(__dirname, 'create-watch-and-move.js');
            const child = spawn('node', [script, JSON.stringify(comfyParams)], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref(); // Detached from parent
        }

        saveLog(`OUTPUT: ${output}`);
        console.log(output);
    } catch (error) {
        // Agora 'request' pode estar indefinido se o JSON.parse falhar
        const requestId = request ? request.id : null;
        const errorMessage = protocol.errorMessage(requestId, -32700, 'Parse error');
        const output = JSON.stringify(errorMessage);
        saveLog(`ERROR: ${output}`);
        console.log(output); // Envia o erro de volta para o cliente
    }
});

// Ações para quando o stdin é fechado (raro em servers de longa duração)
rl.on('close', () => {
    process.exit(0);
});
