import fs from 'fs';
import config from './config.js';
import path from 'path';
import makePayload from './models.js';

const comfyParams = JSON.parse(process.argv[2]);
const maxRetries = 600; // 10 minutes
const retryInterval = 3000; // 3 second
const outputPath = comfyParams.outputPath;
const fileName = comfyParams.fileName;
const outputName = path.join(outputPath, fileName);

const models = {
    'flux-krea-t2i': makePayload
};

const saveLog = (data) => {
    if (!config.server.debug) return;
    const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
    fs.appendFile('/tmp/mcp-http-server.log', dataStr + '\n', (err) => {});
};

saveLog(`PARAMS: ${JSON.stringify(comfyParams)}`);
saveLog(`PARAMS: ${JSON.stringify(config)}`);

// create
const callComfyUICreate = async (workflow) => {
    try {
        const response = await fetch(`http://${config.comfyui.host}:${config.comfyui.port}/prompt`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ prompt: workflow }),
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const responseData = await response.json();
        return responseData;
    } catch (error) {
        throw error;
    }
};

// watchAndCopy
(async () => {
    try {
        const cResp = await callComfyUICreate(models[comfyParams.model](comfyParams));
        const promptId = cResp.prompt_id;
        let data = {};
    
        saveLog(`PROMPT_ID: ${promptId}`);
    
        for (let i = 0; i < maxRetries; i++) {
            const response = await fetch(`http://${config.comfyui.host}:${config.comfyui.port}/history/${promptId}`);
            data = await response.json();
    
            if (data[promptId]) {
                saveLog(`BREAK: ${JSON.stringify(data)}`);
                break;
            }
            
            await new Promise((resolve) => setTimeout(resolve, retryInterval));
        }
        
        saveLog(`DATA: ${JSON.stringify(data)}`);
        if (!data[promptId]) {
            return false;
        }
        
        const outputObj = Object.keys(data[promptId]["outputs"])[0];
        const outputFile = data[promptId]["outputs"][outputObj]["images"][0]["filename"];
        const confyUIOutputName = path.join(config.comfyui.comfyUIOutputPath, outputFile);
        if (fs.existsSync(confyUIOutputName) && fs.existsSync(outputPath)) {
            fs.copyFileSync(confyUIOutputName, outputName);
            fs.unlinkSync(confyUIOutputName);
            // cross-device link not permitted, rename
            // fs.renameSync(confyUIOutputName, outputName);
        }
    } catch (error) {
        saveLog(`ERROR: ${error}`);
    }
})();
