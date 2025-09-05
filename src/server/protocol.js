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
                description: "Generate high-quality images using ComfyUI with FLUX models. The prompt should be in English and optimized for FLUX for best results. The image generation is asynchronous and will be processed in the background. When the generation is complete, the image will be automatically copied to the specified output folder.",
                inputSchema: {
                    type: "object",
                    properties: {
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
                            description: "FLUX model to use for generation",
                            enum: [
                                "flux-krea-t2i"
                            ],
                            default: "flux-krea-t2i"
                        },
                        output_folder: {
                            type: "string",
                            description: "Absolute path where the generated image will be copied after asynchronous generation is complete"
                        }
                    },
                    required: [
                        "output_folder"
                    ]
                }
            }
        ]
    }
});

const toolsCall = (requestId, args) => {

    const params = args.arguments;
    const outputFolder = params.output_folder;
    const model = params.model || 'flux-krea-t2i';
    const prompt = params.prompt || 'a lovely place';
    const width = params.width >= 1024 ? 1024 : params.width || 544;
    const height = params.height >= 1024 ? 1024 : params.height || 544;
    const seed = params.seed || Math.floor(Math.random() * 1000000000);
    const imageName = 'img.png';

    if (model == 'flux-krea-t2i') {
        return {
            jsonrpc: '2.0',
            id: requestId,
            result: {
                content: [
                    {
                        type: 'text',
                        text: `Image generation started asynchronously using ${model} model with parameters: width=${width}, height=${height}, seed=${seed}, filename=${outputFolder}/${imageName}`
                    },
                    {
                        type: 'text',
                        text: `Prompt: ${prompt}`
                    }
                ]
            }
        };
    }

    return errorMessage(requestId, -32601, `Unknown model: ${model}`);
};

const handleRequest = (request) => {
    if (request.jsonrpc !== '2.0' || !request.method) {
        return errorMessage(null, -32600, 'Invalid Request');
    }

    const { method, params, id } = request;
    const requestId = id !== null && id !== undefined ? id : 0;

    switch (method) {
        case 'initialize':
            return initialize(requestId);
        case 'notifications/initialized':
            return notificationsInitialized(requestId);
        case 'tools/list':
            return toolsList(requestId);
        case 'tools/call':
            return toolsCall(requestId, params);
        default:
            return errorMessage(requestId, -32601, `Method not found: ${method}`);
    }
};

export default {
    handleRequest,
    errorMessage
};