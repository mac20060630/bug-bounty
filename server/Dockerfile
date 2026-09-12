# Multi-stage production Dockerfile for BugBounty Express API Server
FROM node:20-alpine AS base

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache libc6-compat

# Install application dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source code
COPY . .

# Ensure uploads directory exists and set permissions
RUN mkdir -p uploads/evidence && chown -R node:node /app

# Run as non-root user
USER node

# Environment defaults
ENV PORT=5000 \
    NODE_ENV=production

EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

CMD ["node", "server.js"]
