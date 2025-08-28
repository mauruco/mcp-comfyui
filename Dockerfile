# Use Node.js Alpine image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/
COPY workflows/ ./workflows/
COPY index.js ./

# Set environment variables
ENV NODE_ENV=production
ENV MCP_LOG_FILE=./mcp-comfyui.log
ENV MCP_DEBUG=false

# Expose port
EXPOSE 8189

# Create logs directory and change ownership and set permissions of app directory
RUN mkdir -p /app/logs && \
    chmod -R 755 /app

# Switch to non-root user
USER mcpuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8189/mcp || exit 1

# Start the application
CMD ["node", "index.js"]