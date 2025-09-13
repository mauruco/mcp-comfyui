import path from 'path';

// PROTOCAL VERSION 2024-11-05

const errorMessage = (requestId, code, message) => ({
    jsonrpc: '2.0',
    id: requestId,
    error: {
        code,
        message
    }
});

const notificationsInitialized = (requestId) => ({
    jsonrpc: '2.0',
    id: requestId,
    method: 'notifications/initialized'
});

// const notificationsInitialized = () => ({
//     jsonrpc: "2.0",
//     result: "ok"
// });

const initialize = (requestId) => ({
    jsonrpc: '2.0',
    id: requestId,
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
});

const toolsList = (requestId) => ({
    jsonrpc: "2.0",
    id: requestId,
    result: {
        tools: [
            {
                name: "generate_image",
                description: "Generate high-quality images and videos using ComfyUI. This process is asynchronous, running in the background. Once complete, the output will be automatically copied to your specified folder. Output Formats:Images: PNG, Videos: MP4",
                inputSchema: {
                    type: "object",
                    properties: {
                        output_path: {
                            type: "string",
                            description: "Required! The absolute path to the output directory where the generated image will be copied. Do not include a filename in this field."
                        },
                        file_name: {
                            type: "String",
                            description: "Required! Filename for the generated image, including the file extension (e.g., for images \".png\", for videos \".mp4\").",
                        },
                        width: {
                            type: "number",
                            description: "Image width (max 1024, default 544)",
                            minimum: 1,
                            maximum: 1024,
                            default: 544
                        },
                        height: {
                            type: "number",
                            description: "Image height (max 1024, default 544)",
                            minimum: 1,
                            maximum: 1024,
                            default: 544
                        },
                        seed: {
                            type: "number",
                            description: "Random seed for generation defaul: random)"
                        },
                        prompt: {
                            type: "string",
                            description: "English text prompt optimized for FLUX models. Be descriptive and specific for best results.",
                            default: "a lovely place"
                        },
                        model: {
                            type: "string",
                            description: "Image model to use for generation",
                            enum: [
                                "flux-krea-t2i"
                            ],
                            default: "flux-krea-t2i"
                        }
                    },
                    required: [
                        "output_path"
                    ]
                }
            }
        ]
    }
});

const toolsCall = (requestId, args) => {

    const params = args.arguments;
    const outputPath = path.normalize(params.output_path);
    const fileName = path.basename(params.file_name);
    const model = params.model || 'flux-krea-t2i';
    const prompt = params.prompt || 'a lovely place';
    const width = params.width >= 1024 ? 1024 : params.width || 544;
    const height = params.height >= 1024 ? 1024 : params.height || 544;
    const seed = params.seed || Math.floor(Math.random() * 1000000000);
    let message = errorMessage(requestId, -32601, `Unknown model: ${model}`);
    const comfyParams = { model, prompt, width, height, seed, outputPath, fileName };

    if (model == 'flux-krea-t2i') {
        message = {
            jsonrpc: '2.0',
            id: requestId,
            result: {
                content: [
                    {
                        type: 'text',
                        text: `Image generation started asynchronously using ${model} model with parameters: width=${width}, height=${height}, seed=${seed}, output_path=${outputPath}, filename=${fileName}`
                    },
                    {
                        type: 'text',
                        text: `Prompt: ${prompt}`
                    }
                ]
            }
        };
    }

    return { message, comfyParams };
};

const handleRequest = (request) => {
    if (request.jsonrpc !== '2.0' || !request.method) {
        return { message: errorMessage(null, -32600, 'Invalid Request'), comfyParams: {} };
    }
    
    const { method, params, id } = request;
    const requestId = id !== null && id !== undefined ? id : 0;

    switch (method) {
        case 'initialize':
            return { message: initialize(requestId), comfyParams: {} };
        case 'notifications/initialized':
            return { message: notificationsInitialized(requestId), comfyParams: {} };
        case 'tools/list':
            return { message: toolsList(requestId), comfyParams: {} };
        case 'tools/call':
            if (!params?.arguments?.output_path || !params?.arguments?.file_name) {
                return { message: errorMessage(requestId, -32600, 'Invalid Request'), comfyParams: {} };
            }
            return toolsCall(requestId, params);
        default:
            return { message: errorMessage(requestId, -32601, `Method not found: ${method}`), comfyParams: {} };
    }
};

export default {
    handleRequest,
    errorMessage
};