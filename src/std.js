import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawn } from 'child_process';
import config from './config.js';
import protocol from './protocol.js';
const __dirname = import.meta.dirname;

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
    try {
        // log
        saveLog(`LINE: ${line}`);
        
        // Handle the request and get the protocol response
        const { message, comfyParams, respond } = protocol.handleRequest(line);

        // Don't respond 
        if (!respond) return;
        
        // Handle ComfyUI calls asynchronously AFTER sending the response
        if (Object.keys(comfyParams).length > 0) {
            const script = path.join(__dirname, 'create-watch-and-move.js');
            const child = spawn('node', [script, JSON.stringify(comfyParams)], {
                detached: true,
                stdio: 'ignore'
            });
            child.unref(); // Detached from parent
        }
        
        // finally send the response
        console.log(message);
        
        // log
        saveLog(`OUTPUT: ${message}`);
    } catch (error) {
        saveLog(`INTERNAL ERROR: ${JSON.stringify(error.message)}`);
        const errorMessage = JSON.stringify(protocol.errorMessage(null, -32603, 'Internal error', error.message));
        console.log(errorMessage);
    }
});

// Ações para quando o stdin é fechado (raro em servers de longa duração)
rl.on('close', () => {
    process.exit(0);
});
