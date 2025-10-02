#!/usr/bin/env bash
export COMFYUI_OUTPUT_PATH=/home/mauruco/Downloads/_comfyui/output/
export MCP_DEBUG=true

# # initialize
# {"jsonrpc":"2.0","id":1,"method":"initialize", "params":{"protocolVersion": "2024-11-05"}}

# # tools/list
# {"jsonrpc":"2.0","id":2,"method":"tools/list"}

# # tools/call
# {"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"arguments":{"file_name":"teste-image.png","model":"flux-krea-t2i","prompt":"alovelyplace","output_path":"/home/mauruco/Downloads/_comfyui/output/","width":544,"height":544,"sed":1313}}}

# # ping
# {"jsonrpc":"2.0","id":1,"method":"ping"}

# do not respond to
# {"jsonrpc": "2.0", "method": "notifications/initialized"}
# {"jsonrpc": "2.0", "method": "notifications/cancelled", "params": {"progressToken": "abc123","progress": 50,"total": 100,"message": "Reticulating splines..."}}
# {"jsonrpc": "2.0", "method": "notifications/progress", "params": {"requestId": "123","reason": "User requested cancellation"}}

# strict mode
set -euo pipefail

trap 'exec 3>&-; rm -f $PIPE_IN $PIPE_OUT' EXIT

# criando as pipes
PIPE_IN=$(mktemp -u)
PIPE_OUT=$(mktemp -u)

[[ -p $PIPE_IN ]] || mkfifo $PIPE_IN
[[ -p $PIPE_OUT ]] || mkfifo $PIPE_OUT

# runing comand in background
# equivalente a: node src/std.js < $PIPE_IN > $PIPE_OUT &
{
    exec 0< $PIPE_IN
    exec 1> $PIPE_OUT
    # npx mcp-hello-world
    node src/std.js
} &
CMD_PID=$!

# abrindo pipe para escrita e mantendo aberta no FD3, sem iso programa recebe EOF
exec 3> $PIPE_IN

# logando node output, background
while read -r line < $PIPE_OUT; do
    echo "$line"
done &

# escutando por input e redirecionando para o pipe
while read -r line; do
    echo "$line" >&3
done

# aguardando o fim do comando
wait $CMD_PID

# cleaning
trap - EXIT