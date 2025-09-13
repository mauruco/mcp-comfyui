#!/usr/bin/env bash
export COMFYUI_OUTPUT_PATH=/home/mauruco/Downloads/_comfyui/output/
export MCP_DEBUG=true


# initialize
initialize='{"jsonrpc":"2.0","id":1,"method":"initialize"}'

# initialize notification
initialize_notification='{"jsonrpc":"2.0","id":null,"method":"notifications/initialized"}'

# tools/list
tools_list='{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# tools/call
tools_call='{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"arguments":{"file_name":"teste-image.png","model":"flux-krea-t2i","prompt":"alovelyplace","output_path":"/home/mauruco/Downloads/_comfyui/output/","width":544,"height":544,"sed":1313}}}'

echo ">>> STARTING TESTS..."
echo "# Initialize..."
echo ${initialize} | node src/std.js

echo "# Initialize notification..."
echo ${initialize_notification} | node src/std.js

echo "# Tools list..."
echo ${tools_list} | node src/std.js

echo "# Tools call..."
echo ${tools_call} | node src/std.js