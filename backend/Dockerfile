# Multi-stage production-ready Dockerfile for Backend Service
FROM node:20-alpine AS base
WORKDIR /app

# Ensure correct folder ownership for non-root user
RUN chown -R node:node /app

# Install dependencies
COPY --chown=node:node package*.json ./
RUN npm ci --only=production

# Copy source files
COPY --chown=node:node . .

# Set environment
ENV NODE_ENV=production
ENV PORT=5000

# Docker Healthcheck
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/health || exit 1

# Expose port
EXPOSE 5000

# Run as non-root user
USER node

# Start command
CMD ["node", "src/server.js"]

