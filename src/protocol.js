import path from 'path';

// PROTOCAL VERSION 2024-11-05
// ERROR CODES 
// Pre-defined JSON-RPC 2.0 error codes:
// -32700: Parse error - Invalid JSON was received
// -32600: Invalid Request - The JSON sent is not a valid Request object
// -32601: Method not found - The method does not exist / is not available
// -32602: Invalid params - Invalid method parameter(s)
// -32603: Internal error - Internal JSON-RPC error
// -32000 to -32099: Server error - Reserved for implementation-defined server-errors
// MCP-specific error codes:
// -32800: Request cancelled - The request was cancelled
// -32801: Content too large - The content is too large

const errorMessage = (requestId, code, message, data) => {
    const response = {
        jsonrpc: '2.0',
        id: requestId,
        error: {
            code,
            message
        }
    };
    if (data) {
        response.error.data = data;
    }
    return response;
};

const initialize = (requestId, params) => {

    // error if protocol version is not supported
    if (!['2024-11-05', '2025-03-26', '2025-06-18'].includes(params.protocolVersion)) {
        return errorMessage(requestId, -32602, 'Unsupported protocol version', {
            supported: ['2024-11-05', '2025-03-26', '2025-06-18'],
            requested: params.protocolVersion
        });
    }

    // protocol version is supported
    return {
        jsonrpc: '2.0',
        id: requestId,
        result: {
            protocolVersion: params.protocolVersion,
            capabilities: {
                tools: {}
            },
            serverInfo: {
                name: 'mcp-comfyui-server',
                version: '1.0.0'
            }
        }
    };
};

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
                            type: "string",
                            description: "Required! Image file, including the file extension (e.g., for images \".png\", for videos \".mp4\").",
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

    if (!params?.output_path) {
        return { message: JSON.stringify(errorMessage(requestId, -32602, 'Invalid Request', "output_path")), comfyParams: {}, respond: true };
    }

    if (!params?.file_name) {
        return { message: JSON.stringify(errorMessage(requestId, -32602, 'Invalid Request', "file_name")), comfyParams: {}, respond: true };
    }

    if (params.model && !['flux-krea-t2i'].includes(params.model)) {
        return { message: JSON.stringify(errorMessage(requestId, -32600, 'Invalid Request')), comfyParams: {}, respond: true };
    }

    const outputPath = path.normalize(params.output_path);
    const fileName = path.basename(params.file_name);
    const model = params.model || 'flux-krea-t2i';
    const prompt = params.prompt || 'a lovely place';
    const width = params.width >= 1024 ? 1024 : params.width || 544;
    const height = params.height >= 1024 ? 1024 : params.height || 544;
    const seed = params.seed || Math.floor(Math.random() * 1000000000);
    const comfyParams = { model, prompt, width, height, seed, outputPath, fileName };

    return { message: JSON.stringify({
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
    }), comfyParams, respond: true };
};

const ping = (requestId) => ({
    jsonrpc: "2.0",
    id: requestId,
    result: {}
});

const handleRequest = (line) => {
    try {
        const trimmedLine = line.trim();
        let request;

        // empty line
        if (trimmedLine === '') {
            return { message: '', comfyParams: {}, respond: false };
        }

        // json parse error
        try {
            request = JSON.parse(trimmedLine);
        } catch (error) {
            return { message: JSON.stringify(errorMessage(null, -32700, 'Parse error')), comfyParams: {}, respond: true };
        }


        // Input is an error
        if (request.error) {
            return { message: '', comfyParams: {}, respond: true };
        }

        if (request.jsonrpc !== '2.0' || !request.method) {
            return { message: JSON.stringify(errorMessage(null, -32600, 'Invalid Request')), comfyParams: {}, respond: true };
        }

        const { method, params, id } = request;
        const requestId = id !== null && id !== undefined ? id : 0;

        switch (method) {

            // do not respond to notifications
            case 'notifications/initialized':
                return { message: '', comfyParams: {}, respond: false };
            case 'notifications/cancelled':
                return { message: '', comfyParams: {}, respond: false };
            case 'notifications/progress':
                return { message: '', comfyParams: {}, respond: false };

            // respond to requests
            case 'initialize':
                return { message: JSON.stringify(initialize(requestId, params)), comfyParams: {}, respond: true };
            case 'tools/list':
                return { message: JSON.stringify(toolsList(requestId)), comfyParams: {}, respond: true };
            case 'tools/call':
                return toolsCall(requestId, params);
            // TOOLS
            case 'ping':
                return { message: JSON.stringify(ping(requestId)), comfyParams: {}, respond: true };

            // DEFAULT
            default:
                return { message: JSON.stringify(errorMessage(requestId, -32601, 'Method not found')), comfyParams: {}, respond: true };
        }
    } catch (error) {
        return { message: JSON.stringify(errorMessage(null, -32603, 'Internal error', error.message)), comfyParams: {}, respond: true };

    }
};

export default {
    handleRequest,
    errorMessage
};