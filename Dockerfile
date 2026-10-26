# ==============================================================================
# Multi-Stage Unified Production Dockerfile
# Group 11 (VESIT D17A) - Smart College Event Management System
# ==============================================================================

# STAGE 1: Build the Modern React SPA Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# STAGE 2: Production Container Runtime (Node.js Alpine)
FROM node:20-alpine AS runner
WORKDIR /app

# Ensure proper non-root ownership
RUN chown -R node:node /app

# Install backend production dependencies
COPY --chown=node:node backend/package*.json ./backend/
RUN cd backend && npm ci --only=production

# Copy backend application source
COPY --chown=node:node backend/ ./backend/

# Copy pre-compiled frontend distribution from Stage 1
COPY --chown=node:node --from=frontend-builder /app/frontend/dist ./frontend/dist

# Environment variables
ENV NODE_ENV=production
ENV PORT=5000

# Expose service port
EXPOSE 5000

# Native Container Healthcheck
HEALTHCHECK --interval=20s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:5000/health || exit 1

# Non-root user for enterprise container security
USER node

# Start Unified Service (React SPA + Express API on single port)
CMD ["node", "backend/src/server.js"]
